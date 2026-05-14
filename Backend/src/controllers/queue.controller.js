const Appointment = require("../models/appointment.model");
const {
  normalizeAppointmentDate,
  allocateNextQueueNumber,
  syncActiveQueueSequential,
  computeLiveQueueInfoForAppointmentId,
} = require("../utils/queueNumber.util");
const { broadcastQueueUpdated } = require("../utils/queueEvents.util");

// ================= CURRENT PATIENT =================
async function getCurrentPatient(req, res) {
  try {
    const current = await Appointment.findOne({
      doctorId: req.user.id,
      status: "approved",
    }).populate("patientId", "username age gender");

    if (!current) {
      return res.status(404).json({
        message: "No patient is being treated currently",
      });
    }

    return res.status(200).json({
      appointmentId: current._id,
      patient: current.patientId,
      queueNumber: current.queueNumber,
      status: current.status,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}

// ================= CALL NEXT PATIENT =================
async function callNextPatient(req, res) {
  try {
    const io = req.app.get("io");
    const doctorRoom = req.user.id.toString();
    const selectedDate = normalizeAppointmentDate(
      req.query.date || new Date().toISOString().split("T")[0]
    );

    // complete previous approved patient for the selected date
    await Appointment.updateMany(
      {
        doctorId: req.user.id,
        status: "approved",
        date: selectedDate,
      },
      {
        status: "completed",
      }
    );

    const nextAppointment = await Appointment.findOne({
      doctorId: req.user.id,
      date: selectedDate,
      status: "pending",
    })
      .sort({ queueNumber: 1, createdAt: 1 })
      .populate("patientId", "username age gender email phone");

    if (!nextAppointment) {
      return res.status(404).json({
        message: "No patients left in queue",
      });
    }

    nextAppointment.status = "approved";
    await nextAppointment.save();

    await broadcastQueueUpdated(io, {
      doctorId: req.user.id,
      date: selectedDate,
    });

    return res.json({
      message: "Next patient called",
      appointmentId: nextAppointment._id,
      queueNumber: nextAppointment.queueNumber,
      patientId: nextAppointment.patientId._id,
      patient: nextAppointment.patientId,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}

// ================= LIVE QUEUE =================
async function getLiveQueue(req, res) {
  try {
    const selectedDate = normalizeAppointmentDate(
      req.query.date || new Date().toISOString().split("T")[0]
    );
    const filter = {
      date: selectedDate,
      status: { $nin: ["completed", "cancelled"] },
    };

    if (req.user.role === "doctor") {
      filter.doctorId = req.user.id;
    } else if (req.user.role === "admin" || req.user.role === "hospital") {
      if (req.query.doctorId) {
        filter.doctorId = req.query.doctorId;
      }
    } else if (req.user.role === "patient") {
      let doctorId = req.query.doctorId;

      if (!doctorId) {
        let activeAppointment = await Appointment.findOne({
          patientId: req.user.id,
          status: { $in: ["pending", "approved"] },
          date: selectedDate,
        });

        if (!activeAppointment) {
          // Fall back to the most recent appointment to infer the assigned doctor
          activeAppointment = await Appointment.findOne({
            patientId: req.user.id,
          }).sort({ date: -1 });
        }

        if (!activeAppointment) {
          return res.status(404).json({
            message: "No appointment found for this patient",
          });
        }

        doctorId = activeAppointment.doctorId;
      } else {
        const ownsAppointment = await Appointment.exists({
          patientId: req.user.id,
          doctorId,
          date: selectedDate,
        });

        if (!ownsAppointment) {
          return res.status(403).json({
            message: "You are not authorized to view this doctor's queue",
          });
        }
      }

      filter.doctorId = doctorId;
    } else {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    await syncActiveQueueSequential(filter.doctorId, selectedDate);

    const queue = await Appointment.find(filter)
      .sort({ queueNumber: 1, createdAt: 1 })
      .populate("patientId", "username age gender")
      .populate("doctorId", "username");

    console.log("🔍 Queue Query Debug:", {
      filter: JSON.stringify(filter),
      selectedDate,
      queueLength: queue.length,
      appointments: queue.map((a) => ({
        patient: a.patientId?.username,
        date: a.date,
        status: a.status,
        queueNumber: a.queueNumber,
      })),
    });

    return res.status(200).json({
      doctorId: filter.doctorId || null,
      date: selectedDate,
      totalWaiting: queue.length,
      patients: queue,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}

// ================= QUEUE POSITION + ESTIMATED TIME =================
async function getQueuePosition(req, res) {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    if (appointment.patientId.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Not authorized to view this appointment",
      });
    }

    const metrics = await computeLiveQueueInfoForAppointmentId(
      req.params.id
    );

    if (!metrics) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    // ⏱️ 10 min per patient (you can change)
    const avgTimePerPatient = 10;
    const estimatedWaitTime = metrics.patientsAhead * avgTimePerPatient;

    return res.status(200).json({
      appointmentId: metrics.appointmentId,
      doctorId: appointment.doctorId,
      yourQueueNumber: metrics.liveQueueNumber,
      patientsAhead: metrics.patientsAhead,
      estimatedWaitTime: `${estimatedWaitTime} minutes`,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}

// ================= ADD TO QUEUE (ADMIN / WALKIN) =================
async function addToQueue(req, res) {
  try {
    const { patientId, doctorId } = req.body;

    const today = normalizeAppointmentDate(new Date());

    const queueNumber = await allocateNextQueueNumber(doctorId, today);

    const appointment = await Appointment.create({
      patientId,
      doctorId,
      queueNumber,
      status: "pending",
      date: today,
    });

    const io = req.app.get("io");
    await broadcastQueueUpdated(io, {
      doctorId,
      date: today,
    });

    return res.status(201).json({
      message: "Added to queue",
      appointment,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}

// ================= COMPLETE CURRENT =================
async function completeCurrent(req, res) {
  try {
    const selectedDate = normalizeAppointmentDate(
      req.query.date || new Date().toISOString().split("T")[0]
    );

    const current = await Appointment.findOne({
      doctorId: req.user.id,
      status: "approved",
      date: selectedDate,
    });

    if (!current) {
      return res.status(404).json({
        message: "No active patient",
      });
    }

    current.status = "completed";
    await current.save();

    const io = req.app.get("io");
    await broadcastQueueUpdated(io, {
      doctorId: req.user.id,
      date: selectedDate,
    });

    return res.json({
      message: "Patient completed",
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
}

// ================= PATIENT DETAILS =================
async function getPatientDetails(req, res) {
  try {
    const { patientId } = req.params;

    const appointment = await Appointment.findOne({
      doctorId: req.user.id,
      patientId,
      status: { $in: ["pending", "approved", "completed"] },
    }).populate(
      "patientId",
      "username age gender email phone"
    );

    if (!appointment) {
      return res.status(404).json({
        message: "Patient not found in your queue",
      });
    }

    return res.status(200).json({
      patient: appointment.patientId,
      appointment: {
        id: appointment._id,
        queueNumber: appointment.queueNumber,
        status: appointment.status,
        date: appointment.date,
      },
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
}

module.exports = {
  getLiveQueue,
  getCurrentPatient,
  callNextPatient,
  getQueuePosition,
  addToQueue,
  completeCurrent,
  getPatientDetails,
};