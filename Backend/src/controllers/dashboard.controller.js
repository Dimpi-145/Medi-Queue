const Appointment = require("../models/appointment.model");
const User = require("../models/user.model");
const {
  normalizeAppointmentDate,
  computeLiveQueueInfoForAppointmentId,
  syncActiveQueueSequential,
  getDoctorQueueStatus,
  getDoctorWorkingDateOptions,
} = require("../utils/queueNumber.util");

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

async function doctorDashboard(req, res) {
  try {
    const doctorId = req.user.id;
    const selectedDate = normalizeAppointmentDate(
      req.query.date || getLocalDateString(),
    );

    await syncActiveQueueSequential(doctorId, selectedDate);

    const doctor = await User.findById(doctorId)
      .select(
        "username email phone specialization department profileImage role schedule hospitalId",
      )
      .populate("hospitalId", "hospitalName username profileImage");
    const queueStatus = getDoctorQueueStatus(doctor?.schedule, selectedDate);
    const workingDates = getDoctorWorkingDateOptions(doctor?.schedule);

    const currentPatient = await Appointment.findOne({
      doctorId,
      date: selectedDate,
      status: "approved",
    }).populate("patientId", "username age gender");

    const nextPatient = await Appointment.findOne({
      doctorId,
      date: selectedDate,
      status: "pending",
    })
      .sort({ queueNumber: 1, createdAt: 1 })
      .populate("patientId", "username age gender");

    const totalWaiting = await Appointment.countDocuments({
      doctorId,
      date: selectedDate,
      status: "pending",
    });

    const completedToday = await Appointment.countDocuments({
      doctorId,
      date: selectedDate,
      status: { $in: ["approved", "completed"] },
    });

    const cancelledToday = await Appointment.countDocuments({
      doctorId,
      date: selectedDate,
      status: "cancelled",
    });

    return res.json({
      doctor,
      date: selectedDate,
      queueStatus,
      workingDates,
      currentPatient,
      nextPatient,
      totalWaiting,
      completedToday,
      cancelledToday,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function patientDashboard(req, res) {
  try {
    const patientId = req.user.id;
    const selectedDate = normalizeAppointmentDate(
      req.query.date || getLocalDateString(),
    );

    // Patient Info
    const patient = await User.findById(patientId).select("-password");

    // All Appointments
    const appointments = await Appointment.find({ patientId })
      .populate("doctorId", "username specialization")
      .sort({ createdAt: -1 });

    let activeAppointment = await Appointment.findOne({
      patientId,
      status: { $in: ["pending", "approved"] },
      date: selectedDate,
    }).populate("doctorId", "username specialization");

    if (!activeAppointment) {
      activeAppointment = await Appointment.findOne({
        patientId,
        status: { $in: ["pending", "approved"] },
        date: { $gte: selectedDate },
      })
        .sort({ date: 1 })
        .populate("doctorId", "username specialization");
    }

    let queueInfo = null;

    if (activeAppointment) {
      const metrics = await computeLiveQueueInfoForAppointmentId(
        activeAppointment._id,
      );

      activeAppointment = await Appointment.findById(
        activeAppointment._id,
      ).populate("doctorId", "username specialization");

      if (metrics) {
        queueInfo = {
          appointmentId: metrics.appointmentId,
          status: metrics.status,
          queueNumber: metrics.liveQueueNumber,
          liveQueueNumber: metrics.liveQueueNumber,
          patientsAhead: metrics.patientsAhead,
        };
      }
    }

    return res.status(200).json({
      patient,
      appointments,
      activeAppointment,
      queueInfo,
      selectedDate,
      prescriptions: [], // add later
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = {
  doctorDashboard,
  patientDashboard,
};
