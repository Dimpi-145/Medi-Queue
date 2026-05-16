const User = require("../models/user.model");
const Appointment = require("../models/appointment.model");
const bcrypt = require("bcrypt");
const {
  normalizeAppointmentDate,
  allocateNextQueueNumber,
} = require("../utils/queueNumber.util");
const {
  findActiveAppointmentConflict,
} = require("../utils/appointmentQueue.util");
const { broadcastQueueUpdated } = require("../utils/queueEvents.util");

// ================= DASHBOARD STATS =================
async function getDashboardStats(req, res) {
  try {
    const query = {};
    const appointmentQuery = {};
    const doctorQuery = { role: "doctor" };

    // Filter by hospital if the user is a hospital
    if (req.user && req.user.role === "hospital") {
      query.hospitalId = req.user.id;
      doctorQuery.hospitalId = req.user.id;
      appointmentQuery.hospitalId = req.user.id;
    }

    const totalPatients = await User.countDocuments({
      role: "patient",
      ...query,
    });
    const totalDoctors = await User.countDocuments(doctorQuery);

    const patientsInQueue = await Appointment.countDocuments({
      status: "pending",
      ...appointmentQuery,
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const appointmentsToday = await Appointment.countDocuments({
      date: { $gte: today },
      ...appointmentQuery,
    });

    return res.status(200).json({
      totalPatients,
      totalDoctors,
      patientsInQueue,
      appointmentsToday,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}

// ================= GET PATIENTS =================
async function getPatients(req, res) {
  try {
    const query = { role: "patient" };

    // Filter by hospital if the user is a hospital
    if (req.user && req.user.role === "hospital") {
      query.hospitalId = req.user.id;
    }

    const patients = await User.find(query).select(
      "username email age gender phone doctorId",
    );

    const formatted = patients.map((p) => ({
      _id: p._id,
      username: p.username,
      email: p.email,
      age: p.age,
      gender: p.gender,
      phone: p.phone,
      doctorId: p.doctorId,
    }));

    return res.status(200).json(formatted);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}

async function adminCreatePatient(req, res) {
  try {
    const { username, email, password, age, gender, phone, doctorId } =
      req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: "Username, email, and password are required" });
    }

    if (String(password).trim().length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    // Add hospitalId from the authenticated hospital user
    const hospitalId =
      req.user && req.user.role === "hospital" ? req.user.id : undefined;

    // Check for duplicate patient in the SAME hospital (not globally)
    const existing = await User.findOne({
      $or: [{ username }, { email }],
      role: "patient",
      hospitalId: hospitalId,
    });

    if (existing) {
      const field = existing.username === username ? "username" : "email";
      return res.status(400).json({
        message: `Patient with this ${field} already exists in this hospital`,
      });
    }

    const hashed = await bcrypt.hash(String(password).trim(), 10);

    const patient = await User.create({
      username,
      email,
      password: hashed,
      role: "patient",
      age,
      gender,
      phone,
      doctorId: doctorId || undefined,
      hospitalId,
    });

    return res.status(201).json({
      message: "Patient created successfully",
      patient: {
        _id: patient._id,
        username: patient.username,
        email: patient.email,
      },
    });
  } catch (error) {
    console.error("Patient creation error");
    return res.status(500).json({ message: "Failed to create patient" });
  }
}

// GET DOCTORS
async function getDoctors(req, res) {
  try {
    const query = { role: "doctor" };

    // Filter by hospital if the user is a hospital
    if (req.user && req.user.role === "hospital") {
      query.hospitalId = req.user.id;
    }

    const doctors = await User.find(query).select(
      "username email specialization schedule",
    );

    const formatted = doctors.map((d) => ({
      _id: d._id,
      username: d.username,
      email: d.email,
      specialization: d.specialization,
      schedule: d.schedule || null,
    }));

    return res.status(200).json(formatted);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}

// GET a single doctor's schedule
async function getDoctorSchedule(req, res) {
  try {
    const { doctorId } = req.params;
    if (!doctorId)
      return res.status(400).json({ message: "doctorId required" });
    const doctor = await User.findOne({ _id: doctorId, role: "doctor" }).select(
      "username schedule",
    );
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    return res.status(200).json({
      doctor: {
        _id: doctor._id,
        username: doctor.username,
        schedule: doctor.schedule || null,
      },
    });
  } catch (err) {
    console.error("GET DOCTOR SCHEDULE ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
}

// UPDATE doctor's schedule (hospital/admin)
async function updateDoctorSchedule(req, res) {
  try {
    const { doctorId } = req.params;
    if (!doctorId)
      return res.status(400).json({ message: "doctorId required" });
    // only allow hospital or admin to update
    if (!req.user || !["hospital", "admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { schedule } = req.body; // expect { weekly: [{day,start,end}], isActiveToday, todayStart, todayEnd }

    const existingDoctor = await User.findOne({
      _id: doctorId,
      role: "doctor",
    }).select("schedule");
    const existingSchedule = existingDoctor?.schedule || {};
    const update = {
      schedule: {
        ...existingSchedule,
        ...(schedule || {}),
      },
    };

    const doctor = await User.findOneAndUpdate(
      { _id: doctorId, role: "doctor" },
      update,
      { new: true, runValidators: true },
    ).select("username schedule");

    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    return res.status(200).json({
      message: "Schedule updated",
      doctor: {
        _id: doctor._id,
        username: doctor.username,
        schedule: doctor.schedule,
      },
    });
  } catch (err) {
    console.error("UPDATE DOCTOR SCHEDULE ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
}

// DOCTOR: update own schedule (toggle active today etc.)
async function updateMySchedule(req, res) {
  try {
    const userId = req.user.id;
    const { schedule } = req.body;
    if (!schedule)
      return res.status(400).json({ message: "schedule payload required" });

    const currentUser = await User.findById(userId).select(
      "schedule hospitalId",
    );
    const mergedSchedule = {
      ...(currentUser?.schedule || {}),
      ...schedule,
    };

    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: { schedule: mergedSchedule } },
      { new: true, runValidators: true },
    ).select("-password");

    if (!updated) return res.status(404).json({ message: "User not found" });

    // notify hospital (if any) so hospital admin UIs can update status in real-time
    try {
      const io = req.app && req.app.get && req.app.get("io");
      if (io && updated.hospitalId) {
        io.to(String(updated.hospitalId)).emit("doctorStatusUpdated", {
          doctorId: updated._id,
          schedule: updated.schedule,
        });
      }
    } catch (emitErr) {
      console.error("Emit doctorStatusUpdated error", emitErr);
    }

    return res.status(200).json({ user: updated });
  } catch (err) {
    console.error("UPDATE MY SCHEDULE ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
}
async function admincreateDoctor(req, res) {
  try {
    const { username, email, password, specialization, hospitalId } = req.body;
    const safePassword =
      password && password.length >= 6 ? password : "doctor123";

    // Use hospitalId from request or from the authenticated hospital user
    const assignedHospitalId =
      hospitalId ||
      (req.user && req.user.role === "hospital" ? req.user.id : undefined);

    if (!assignedHospitalId) {
      return res.status(400).json({ message: "Hospital context is required" });
    }

    // Check for duplicate doctor in the SAME hospital (not globally)
    const existing = await User.findOne({
      $or: [{ username }, { email }],
      role: "doctor",
      hospitalId: assignedHospitalId,
    });

    if (existing) {
      const field = existing.username === username ? "username" : "email";
      return res.status(400).json({
        message: `Doctor with this ${field} already exists in this hospital`,
      });
    }

    const hashed = await bcrypt.hash(safePassword, 10);

    const doctor = await User.create({
      username,
      email,
      password: hashed,
      role: "doctor",
      specialization,
      hospitalId: assignedHospitalId,
    });

    return res.status(201).json({
      message: "Doctor created successfully",
      doctor: {
        _id: doctor._id,
        username: doctor.username,
        email: doctor.email,
        specialization: doctor.specialization,
        hospitalId: doctor.hospitalId,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
async function walkInRegister(req, res) {
  try {
    const { username, email, gender, age, doctorId } = req.body;

    if (!doctorId) {
      return res.status(400).json({
        message: "doctorId is required",
      });
    }

    // 1. Create patient with secure temporary password
    const crypto = require("crypto");
    const tempPassword = crypto.randomBytes(4).toString("hex");

    const hospitalId =
      req.user && req.user.role === "hospital" ? req.user.id : undefined;

    const patient = await User.create({
      username,
      email,
      role: "patient",
      gender,
      age,
      password: await bcrypt.hash(tempPassword, 10),
      hospitalId,
    });

    const today = normalizeAppointmentDate(new Date());
    const queueNumber = await allocateNextQueueNumber(doctorId, today);

    const appointment = await Appointment.create({
      patientId: patient._id,
      doctorId,
      queueNumber,
      status: "pending",
      source: "walk-in",
      date: today,
      hospitalId,
    });

    const io = req.app.get("io");
    await broadcastQueueUpdated(io, {
      doctorId,
      date: today,
    });

    return res.status(201).json({
      message: "Walk-in patient registered and added to queue",
      patient,
      appointment,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}

// ================= GET ALL APPOINTMENTS =================
async function getAppointments(req, res) {
  try {
    const query = {};

    // Filter by hospital if the user is a hospital
    if (req.user && req.user.role === "hospital") {
      query.hospitalId = req.user.id;
    }

    const appointments = await Appointment.find(query)
      .populate("patientId", "username age gender")
      .populate("doctorId", "username specialization")
      .sort({ date: -1, queueNumber: 1 });

    const formatted = appointments.map((app) => ({
      _id: app._id,
      patient: app.patientId?.username || "Unknown",
      doctor: app.doctorId?.username || "Unknown",
      specialization: app.doctorId?.specialization || "",
      date: app.date,
      timeSlot: app.timeSlot,
      queueNumber: app.queueNumber,
      status: app.status,
      source: app.source,
    }));

    return res.status(200).json(formatted);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}

// ================= ADMIN BOOK APPOINTMENT =================
async function adminBookAppointment(req, res) {
  try {
    const { patientId, doctorId, date, timeSlot } = req.body;

    const normalizedDate = normalizeAppointmentDate(date);

    const existing = await findActiveAppointmentConflict({
      patientId,
      doctorId,
      date: normalizedDate,
    });

    if (existing) {
      return res.status(400).json({
        message:
          "Patient already has an appointment with this doctor on this date",
      });
    }

    const queueNumber = await allocateNextQueueNumber(doctorId, normalizedDate);

    const hospitalId =
      req.user && req.user.role === "hospital" ? req.user.id : undefined;

    const appointment = await Appointment.create({
      patientId,
      doctorId,
      date: normalizedDate,
      timeSlot,
      queueNumber,
      status: "pending",
      hospitalId,
    });

    const io = req.app.get("io");
    await broadcastQueueUpdated(io, {
      doctorId,
      date: normalizedDate,
    });

    return res.status(201).json({
      message: "Appointment booked successfully",
      appointment,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function getHospitalProfile(req, res) {
  try {
    // Only hospital users can access their own profile
    if (req.user && req.user.role === "hospital") {
      const hospital = await User.findById(req.user.id).select(
        "hospitalName phone email profileImage locationUrl",
      );

      if (!hospital) {
        return res.status(404).json({ message: "Hospital not found" });
      }

      return res.status(200).json({
        _id: hospital._id,
        hospitalName: hospital.hospitalName,
        phone: hospital.phone,
        email: hospital.email,
        profileImage: hospital.profileImage,
        locationUrl: hospital.locationUrl || "",
      });
    }

    return res
      .status(403)
      .json({ message: "Only hospitals can access their profile" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function updateHospitalProfile(req, res) {
  try {
    // Only hospital users can update their own profile
    if (req.user && req.user.role === "hospital") {
      const { hospitalName, phone, locationUrl } = req.body;

      const hospital = await User.findByIdAndUpdate(
        req.user.id,
        {
          hospitalName,
          phone,
          locationUrl,
        },
        { new: true, runValidators: true },
      ).select("hospitalName phone email profileImage locationUrl");

      if (!hospital) {
        return res.status(404).json({ message: "Hospital not found" });
      }

      return res.status(200).json({
        message: "Hospital profile updated successfully",
        hospital: {
          _id: hospital._id,
          hospitalName: hospital.hospitalName,
          phone: hospital.phone,
          email: hospital.email,
          profileImage: hospital.profileImage,
          locationUrl: hospital.locationUrl || "",
        },
      });
    }

    return res
      .status(403)
      .json({ message: "Only hospitals can update their profile" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

// ================= GET HOSPITAL DETAILS BY ID (PUBLIC) =================
async function getHospitalDetailsById(req, res) {
  try {
    const { hospitalId } = req.params;

    if (!hospitalId) {
      return res.status(400).json({ message: "Hospital ID is required" });
    }

    const hospital = await User.findById(hospitalId).select(
      "hospitalName phone email locationUrl",
    );

    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }

    return res.status(200).json({
      _id: hospital._id,
      hospitalName: hospital.hospitalName,
      phone: hospital.phone,
      email: hospital.email,
      locationUrl: hospital.locationUrl || "",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = {
  getDashboardStats,
  getPatients,
  adminCreatePatient,
  walkInRegister,
  getDoctors,
  admincreateDoctor,
  getAppointments,
  adminBookAppointment,
  getHospitalProfile,
  updateHospitalProfile,
  getHospitalDetailsById,
  getDoctorSchedule,
  updateDoctorSchedule,
  updateMySchedule,
};
