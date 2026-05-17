const Appointment = require("../models/appointment.model");
const {
  normalizeAppointmentDate,
  allocateNextQueueNumber,
  syncActiveQueueSequential,
  computeLiveQueueInfoForAppointmentId,
  getDoctorQueueStatus,
  getEstimatedWaitTimeForPatientsAhead,
} = require("../utils/queueNumber.util");
const { dedupeQueueEntries } = require("../utils/appointmentQueue.util");
const User = require("../models/user.model");
const { broadcastQueueUpdated } = require("../utils/queueEvents.util");

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

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
    const selectedDate = normalizeAppointmentDate(
      req.query.date || getLocalDateString(),
    );
    const requestedStatus = String(
      req.body?.currentStatus || req.query.currentStatus || "completed",
    ).toLowerCase();
    const currentStatus =
      requestedStatus === "pending" ? "pending" : "completed";
    const currentAppointmentId =
      req.body?.appointmentId || req.query.appointmentId;
    const doctor = await User.findById(req.user.id).select("schedule");
    const queueStatus = getDoctorQueueStatus(
      doctor?.schedule,
      selectedDate,
      new Date(),
      {
        enforceToday: false,
      },
    );

    if (!queueStatus.isActive) {
      return res.status(403).json({
        message: queueStatus.reason || "Queue is inactive for this date",
        queueStatus,
      });
    }

    const activeQuery = {
      doctorId: req.user.id,
      status: "approved",
      date: selectedDate,
    };

    let currentAppointment = await Appointment.findOne(
      currentAppointmentId
        ? {
            _id: currentAppointmentId,
            doctorId: req.user.id,
            date: selectedDate,
          }
        : activeQuery,
    ).populate("patientId", "username age gender email phone");

    if (!currentAppointment && currentAppointmentId) {
      currentAppointment = await Appointment.findOne(activeQuery).populate(
        "patientId",
        "username age gender email phone",
      );
    }

    if (!currentAppointment) {
      return res.status(404).json({
        message: "No active patient",
      });
    }

    currentAppointment.status = currentStatus;
    if (currentStatus === "completed") {
      currentAppointment.completedAt = new Date();
      currentAppointment.consultationEndedAt = currentAppointment.completedAt;
    }
    const currentStartedAt = new Date(
      currentAppointment.consultationStartedAt ||
        currentAppointment.approvedAt ||
        currentAppointment.createdAt,
    );
    const currentEndedAt = new Date(currentAppointment.consultationEndedAt);
    if (
      !Number.isNaN(currentStartedAt.getTime()) &&
      !Number.isNaN(currentEndedAt.getTime()) &&
      currentEndedAt > currentStartedAt
    ) {
      currentAppointment.consultationDurationMinutes = Math.max(
        1,
        Math.round(
          (currentEndedAt.getTime() - currentStartedAt.getTime()) / 60000,
        ),
      );
    }
    await currentAppointment.save();

    let nextAppointment = await Appointment.findOne({
      doctorId: req.user.id,
      date: selectedDate,
      status: "pending",
      _id: { $ne: currentAppointment._id },
      queueNumber: { $gt: currentAppointment.queueNumber },
    })
      .sort({ queueNumber: 1, createdAt: 1 })
      .populate("patientId", "username age gender email phone");

    if (!nextAppointment) {
      nextAppointment = await Appointment.findOne({
        doctorId: req.user.id,
        date: selectedDate,
        status: "pending",
        _id: { $ne: currentAppointment._id },
      })
        .sort({ queueNumber: 1, createdAt: 1 })
        .populate("patientId", "username age gender email phone");
    }

    if (!nextAppointment) {
      await broadcastQueueUpdated(io, {
        doctorId: req.user.id,
        date: selectedDate,
      });

      return res.json({
        message: "Current patient updated",
        currentAppointmentId: currentAppointment._id,
        currentStatus: currentAppointment.status,
        queueStatus,
      });
    }

    nextAppointment.status = "approved";
    nextAppointment.approvedAt = new Date();
    nextAppointment.consultationStartedAt = nextAppointment.approvedAt;
    await nextAppointment.save();

    await broadcastQueueUpdated(io, {
      doctorId: req.user.id,
      date: selectedDate,
    });

    return res.json({
      message: "Next patient called",
      currentAppointmentId: currentAppointment._id,
      currentStatus: currentAppointment.status,
      appointmentId: nextAppointment._id,
      queueNumber: nextAppointment.queueNumber,
      patientId: nextAppointment.patientId._id,
      patient: nextAppointment.patientId,
      queueStatus,
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
      req.query.date || getLocalDateString(),
    );
    const doctorId =
      req.user.role === "doctor" ? req.user.id : req.query.doctorId || null;
    const doctor = doctorId
      ? await User.findById(doctorId).select("schedule")
      : null;
    const queueStatus = getDoctorQueueStatus(doctor?.schedule, selectedDate);
    const filter = {
      date: selectedDate,
      status: { $nin: ["cancelled"] },
    };

    if (req.user.role === "doctor") {
      filter.doctorId = req.user.id;
      filter.status = "pending";
    } else if (req.user.role === "admin" && req.query.doctorId) {
      filter.doctorId = req.query.doctorId;
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

    const uniqueQueue = dedupeQueueEntries(queue);

    console.log("🔍 Queue Query Debug:", {
      filter: JSON.stringify(filter),
      selectedDate,
      queueLength: uniqueQueue.length,
      appointments: uniqueQueue.map((a) => ({
        patient: a.patientId?.username,
        date: a.date,
        status: a.status,
        queueNumber: a.queueNumber,
      })),
    });

    return res.status(200).json({
      doctorId: filter.doctorId || null,
      date: selectedDate,
      queueStatus,
      totalWaiting: uniqueQueue.length,
      patients: uniqueQueue,
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

    const metrics = await computeLiveQueueInfoForAppointmentId(req.params.id);

    if (!metrics) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    const waitMetrics = await getEstimatedWaitTimeForPatientsAhead(
      appointment.doctorId,
      metrics.patientsAhead,
    );

    return res.status(200).json({
      appointmentId: metrics.appointmentId,
      doctorId: appointment.doctorId,
      yourQueueNumber: metrics.liveQueueNumber,
      patientsAhead: metrics.patientsAhead,
      averageConsultationMinutes: waitMetrics.averageConsultationMinutes,
      estimatedWaitMinutes: waitMetrics.estimatedWaitMinutes,
      estimatedWaitTime: `${waitMetrics.estimatedWaitMinutes} minutes`,
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
      req.query.date || getLocalDateString(),
    );
    const doctor = await User.findById(req.user.id).select("schedule");
    const queueStatus = getDoctorQueueStatus(
      doctor?.schedule,
      selectedDate,
      new Date(),
      {
        enforceToday: false,
      },
    );

    if (!queueStatus.isActive) {
      return res.status(403).json({
        message: queueStatus.reason || "Queue is inactive for this date",
        queueStatus,
      });
    }

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
    current.completedAt = new Date();
    current.consultationEndedAt = current.completedAt;
    const startedAt = new Date(
      current.consultationStartedAt || current.approvedAt || current.createdAt,
    );
    const endedAt = new Date(current.consultationEndedAt);
    if (
      !Number.isNaN(startedAt.getTime()) &&
      !Number.isNaN(endedAt.getTime()) &&
      endedAt > startedAt
    ) {
      current.consultationDurationMinutes = Math.max(
        1,
        Math.round((endedAt.getTime() - startedAt.getTime()) / 60000),
      );
    }
    await current.save();

    const io = req.app.get("io");
    await broadcastQueueUpdated(io, {
      doctorId: req.user.id,
      date: selectedDate,
    });

    return res.json({
      message: "Patient completed",
      queueStatus,
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
    }).populate("patientId", "username age gender email phone");

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
