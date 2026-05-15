const Appointment = require("../models/appointment.model");
const User = require("../models/user.model");
const {
  normalizeAppointmentDate,
  allocateNextQueueNumber,
  syncActiveQueueSequential,
} = require("../utils/queueNumber.util");
const { broadcastQueueUpdated } = require("../utils/queueEvents.util");

// ================= BOOK =================
async function bookAppointment(req, res) {
  try {
    console.log("[bookAppointment] incoming request body:", req.body);
    console.log("[bookAppointment] req.user:", req.user);

    const { doctorId, hospitalId, date, timeSlot } = req.body;

    if (!req.user || !req.user.id) {
      console.warn("[bookAppointment] missing req.user - unauthorized request");
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!doctorId || !date || !timeSlot) {
      console.warn("[bookAppointment] missing required fields:", {
        doctorId,
        hospitalId,
        date,
        timeSlot,
      });
      return res.status(400).json({
        message: "doctorId, date, and timeSlot are required",
      });
    }

    let normalizedDate;
    try {
      normalizedDate = normalizeAppointmentDate(date);
      console.log("[bookAppointment] normalized date:", normalizedDate);
    } catch (err) {
      console.error("[bookAppointment] date normalization error:", err.message);
      return res.status(400).json({ message: err.message });
    }

    // ✅ CHECK DUPLICATE (date + timeSlot)
    try {
      const existingAppointment = await Appointment.findOne({
        patientId: req.user.id,
        doctorId,
        date: normalizedDate,
        timeSlot,
        status: { $in: ["pending", "approved"] },
      });

      if (existingAppointment) {
        console.log("[bookAppointment] duplicate appointment found");
        return res.status(400).json({
          message: "You already booked this slot",
        });
      }
    } catch (err) {
      console.error("[bookAppointment] duplicate check error:", err.message);
      return res
        .status(500)
        .json({ message: "Database error checking duplicates" });
    }

    let queueNumber;
    try {
      queueNumber = await allocateNextQueueNumber(doctorId, normalizedDate);
      console.log("[bookAppointment] allocated queue number:", queueNumber);
    } catch (err) {
      console.error("[bookAppointment] queue allocation error:", err.message);
      return res.status(500).json({
        message: "Error allocating queue number",
        error: err.message,
      });
    }

    const doctor = await User.findOne({ _id: doctorId, role: "doctor" }).select(
      "hospitalId",
    );

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    if (hospitalId && String(doctor.hospitalId || "") !== String(hospitalId)) {
      return res.status(400).json({
        message: "Selected doctor does not belong to the selected hospital",
      });
    }

    let appointment;
    try {
      appointment = await Appointment.create({
        patientId: req.user.id,
        doctorId,
        hospitalId: doctor.hospitalId,
        date: normalizedDate,
        timeSlot,
        queueNumber,
        status: "pending",
      });
      console.log("[bookAppointment] appointment created:", appointment._id);
    } catch (err) {
      console.error(
        "[bookAppointment] appointment creation error:",
        err.message,
      );
      return res.status(500).json({
        message: "Error creating appointment",
        error: err.message,
      });
    }

    try {
      const io = req.app.get("io");
      if (io) {
        await broadcastQueueUpdated(io, {
          doctorId,
          date: normalizedDate,
        });
        console.log("[bookAppointment] queue update broadcast sent");
      } else {
        console.warn("[bookAppointment] io not available for broadcasting");
      }
    } catch (err) {
      console.error("[bookAppointment] broadcast error:", err.message);
      // Don't fail the request if broadcast fails
    }

    console.log("[bookAppointment] success - appointment created");
    return res.status(201).json({
      message: "Appointment booked successfully",
      appointment,
    });
  } catch (error) {
    console.error("[bookAppointment] unexpected error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
}

// ================= PATIENT =================
async function getMyAppointments(req, res) {
  try {
    const appointments = await Appointment.find({
      patientId: req.user.id,
      status: { $in: ["pending", "approved"] },
    })
      .populate("doctorId", "username specialization")
      .sort({ date: -1 }); // ✅ latest first

    const formattedAppointments = appointments.map((app) => ({
      id: app._id,
      doctorId: app.doctorId?._id,
      doctor: app.doctorId?.username || "Doctor",
      specialization: app.doctorId?.specialization || "",
      date: app.date,
      timeSlot: app.timeSlot,
      queueNumber: app.queueNumber,
      status: app.status,
    }));

    return res.status(200).json(formattedAppointments);
  } catch (error) {
    const statusCode =
      error.message.includes("required") ||
      error.message.includes("Invalid appointment date")
        ? 400
        : 500;

    return res.status(statusCode).json({
      message: error.message,
    });
  }
}

// ================= DOCTOR =================
async function getDoctorAppointments(req, res) {
  try {
    const selectedDate = req.query.date
      ? normalizeAppointmentDate(req.query.date)
      : null;

    if (selectedDate) {
      await syncActiveQueueSequential(req.user.id, selectedDate);
    }

    const filter = {
      doctorId: req.user.id,
      status: { $in: ["pending", "approved"] },
    };

    if (selectedDate) {
      filter.date = selectedDate;
    }

    const appointments = await Appointment.find(filter)
      .populate("patientId", "username age gender")
      .sort(
        selectedDate
          ? { queueNumber: 1, createdAt: 1 }
          : { date: 1, queueNumber: 1, createdAt: 1 },
      );

    const formattedAppointments = appointments.map((app) => ({
      _id: app._id,
      id: app._id,
      patient: app.patientId,
      date: app.date,
      timeSlot: app.timeSlot,
      queueNumber: app.queueNumber,
      status: app.status,
    }));

    return res.status(200).json(formattedAppointments);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}

// ================= DOCTOR HISTORY =================
async function getDoctorHistory(req, res) {
  try {
    const consultations = await Appointment.find({
      doctorId: req.user.id,
      status: "completed",
    })
      .populate("patientId", "username age gender profileImage phone")
      .sort({ updatedAt: -1 });

    const history = consultations.map((appointment) => ({
      id: appointment._id,
      patient: appointment.patientId,
      date: appointment.date,
      queueNumber: appointment.queueNumber,
      status: appointment.status,
      createdAt: appointment.createdAt,
    }));

    return res.status(200).json({ consultations: history });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

// ================= PATIENT HISTORY =================
async function getPatientHistory(req, res) {
  try {
    const appointments = await Appointment.find({
      patientId: req.user.id,
      status: { $in: ["completed", "cancelled"] },
    })
      .populate("doctorId", "username specialization")
      .sort({ date: -1 });

    const formattedAppointments = appointments.map((app) => ({
      id: app._id,
      doctorId: app.doctorId?._id,
      doctor: app.doctorId?.username || "Doctor",
      specialization: app.doctorId?.specialization || "",
      date: app.date,
      timeSlot: app.timeSlot,
      queueNumber: app.queueNumber,
      status: app.status,
    }));

    return res.status(200).json(formattedAppointments);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}

// ================= GET DOCTORS =================
async function getDoctors(req, res) {
  try {
    const { department, hospitalId } = req.query;

    const filter = {
      role: "doctor",
    };

    if (hospitalId) {
      filter.hospitalId = hospitalId;
    }

    if (department) {
      filter.specialization = department;
    }

    const doctors = await User.find(filter).select(
      "username department specialization hospitalId schedule",
    );

    return res.status(200).json(doctors);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}

// ================= CANCEL =================
async function cancelAppointment(req, res) {
  try {
    const appointmentId = req.params.id;

    if (!appointmentId) {
      return res.status(400).json({ message: "Appointment id is required" });
    }

    const appointment = await Appointment.findById(appointmentId);
    const io = req.app.get("io");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.patientId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    // Only allow cancelling pending or approved appointments
    if (!["pending", "approved"].includes(appointment.status)) {
      return res.status(400).json({
        message: "Only pending or approved appointments can be cancelled",
      });
    }

    const doctorId = appointment.doctorId.toString();

    appointment.status = "cancelled";
    await appointment.save();

    await syncActiveQueueSequential(doctorId, appointment.date);

    await broadcastQueueUpdated(io, {
      doctorId,
      date: normalizeAppointmentDate(appointment.date),
      patientId: appointment.patientId.toString(),
    });

    io.to(appointment.patientId.toString()).emit("appointmentCancelled", {
      appointmentId: appointment._id,
      message: "Your appointment has been cancelled",
    });

    return res.status(200).json({
      message: "Appointment cancelled successfully",
      appointment,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

// ================= RESCHEDULE =================
async function rescheduleAppointment(req, res) {
  try {
    const { appointmentId, newDate, newTimeSlot } = req.body;
    const io = req.app.get("io");

    if (!appointmentId || !newDate || !newTimeSlot) {
      return res.status(400).json({
        message: "appointmentId, newDate, and newTimeSlot are required",
      });
    }

    const appointment = await Appointment.findById(appointmentId)
      .populate("patientId", "username email")
      .populate("doctorId", "username email");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.patientId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const normalizedNewDate = normalizeAppointmentDate(newDate);

    // Check if new slot already exists
    const existingSlot = await Appointment.findOne({
      doctorId: appointment.doctorId._id,
      date: normalizedNewDate,
      timeSlot: newTimeSlot,
      status: { $in: ["pending", "approved"] },
    });

    if (existingSlot) {
      return res.status(400).json({
        message: "This time slot is already booked",
      });
    }

    const newQueueNumber = await allocateNextQueueNumber(
      appointment.doctorId._id,
      normalizedNewDate,
    );

    // Mark old appointment as rescheduled
    appointment.status = "rescheduled";
    await appointment.save();

    // Create new appointment
    const newAppointment = await Appointment.create({
      patientId: appointment.patientId._id,
      doctorId: appointment.doctorId._id,
      date: normalizedNewDate,
      timeSlot: newTimeSlot,
      queueNumber: newQueueNumber,
      status: "pending",
      source: appointment.source,
    })
      .populate("patientId", "username email")
      .populate("doctorId", "username email");

    // Emit socket events
    await broadcastQueueUpdated(io, {
      doctorId: appointment.doctorId._id,
      date: normalizedNewDate,
    });

    return res.status(200).json({
      message: "Appointment rescheduled successfully",
      oldAppointment: appointment,
      newAppointment,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

// ================= CALL NEXT =================
async function callNextPatient(req, res) {
  try {
    const nextAppointment = await Appointment.findOne({
      doctorId: req.user.id,
      status: "pending",
    }).sort({ queueNumber: 1 });

    if (!nextAppointment) {
      return res.status(404).json({
        message: "No patients in queue",
      });
    }

    nextAppointment.status = "approved";
    await nextAppointment.save();

    return res.json({
      message: "Next patient called",
      appointmentId: nextAppointment._id,
      queueNumber: nextAppointment.queueNumber,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// ================= COMPLETE =================
async function completeAppointment(req, res) {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Not found" });
    }

    appointment.status = "completed";
    await appointment.save();

    const io = req.app.get("io");
    await broadcastQueueUpdated(io, {
      doctorId: appointment.doctorId,
      date: normalizeAppointmentDate(appointment.date),
    });

    return res.json({
      message: "Appointment completed",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

module.exports = {
  bookAppointment,
  getMyAppointments,
  getDoctorAppointments,
  getDoctors,
  cancelAppointment,
  rescheduleAppointment,
  callNextPatient,
  completeAppointment,
  getDoctorHistory,
  getPatientHistory,
};
