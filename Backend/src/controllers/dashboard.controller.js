const Appointment = require("../models/appointment.model");
const User = require("../models/user.model");

async function doctorDashboard(req, res) {
  try {
    const doctorId = req.user.id;
    const selectedDate = req.query.date || new Date().toISOString().split("T")[0];

    const doctor = await User.findById(doctorId).select(
      "username email specialization department profileImage role"
    );

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
      .sort({ queueNumber: 1 })
      .populate("patientId", "username age gender");

    const totalWaiting = await Appointment.countDocuments({
      doctorId,
      date: selectedDate,
      status: "pending",
    });

    const completedToday = await Appointment.countDocuments({
      doctorId,
      date: selectedDate,
      status: "completed",
    });

    const cancelledToday = await Appointment.countDocuments({
      doctorId,
      date: selectedDate,
      status: "cancelled",
    });

    return res.json({
      doctor,
      date: selectedDate,
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
    const selectedDate = req.query.date || new Date().toISOString().split("T")[0];

    // Patient Info
    const patient = await User.findById(patientId).select("-password");

    // All Appointments
    const appointments = await Appointment.find({ patientId })
      .populate("doctorId", "username specialization")
      .sort({ createdAt: -1 });

    // Active Appointment for selected date
    const activeAppointment = await Appointment.findOne({
      patientId,
      status: { $in: ["pending", "approved"] },
      date: selectedDate,
    }).populate("doctorId", "username specialization");

    let queueInfo = null;

    if (activeAppointment) {
      const patientsAhead = await Appointment.countDocuments({
        doctorId: activeAppointment.doctorId._id,
        date: activeAppointment.date,
        status: "pending",
        queueNumber: { $lt: activeAppointment.queueNumber },
      });

      queueInfo = {
        appointmentId: activeAppointment._id,
        status: activeAppointment.status,
        queueNumber: activeAppointment.queueNumber,
        patientsAhead,
      };
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