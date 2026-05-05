const Appointment = require("../models/appointment.model")

async function getCurrentPatient(req, res) {
    try {
        const current = await Appointment.findOne({
            doctorId: req.user.id,
            status: "active"
        }).populate("patientId", "username age gender")

        if (!current) {
            return res.status(404).json({
                message: "No patient is being treated currently"
            })
        }

        return res.status(200).json({
            appointmentId: current._id,
            patient: current.patientId,
            queueNumber: current.queueNumber,
            status: current.status
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message
        })
    }
}
async function callNextPatient(req, res) {
    try {

        console.log("USER:", req.user)
        const nextAppointment = await Appointment.findOne({
            doctorId: req.user.id,
            status: "pending"
        }).sort({ queueNumber: 1 })

        if (!nextAppointment) {
            return res.status(404).json({
                message: "No patients in queue"
            })
        }

        nextAppointment.status = "approved"
        await nextAppointment.save()

        const io = req.app.get("io")   

        io.emit("queueUpdated", {
            doctorId: req.user.id,
            message: "Queue updated"
        })

        return res.json({
            message: "Next patient called",
            appointmentId: nextAppointment._id,
            queueNumber: nextAppointment.queueNumber,
            patientId: nextAppointment.patientId
        })

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}
async function getLiveQueue(req, res) {
  try {
    let doctorId = req.user.id;

    // ✅ If admin, use query doctorId
    if (req.user.role === "admin") {
      doctorId = req.query.doctorId;
    }

    const queue = await Appointment.find({
      doctorId,
      status: "pending",
    })
      .sort({ queueNumber: 1 })
      .populate("patientId", "username age gender");

    return res.status(200).json({
      doctorId,
      totalWaiting: queue.length,
      patients: queue,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
async function getQueuePosition(req, res) {
    try {
        const appointment = await Appointment.findById(req.params.id)

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" })
        }

        // count how many pending before this
        const count = await Appointment.countDocuments({
            doctorId: appointment.doctorId,
            date: appointment.date,
            status: "pending",
            queueNumber: { $lt: appointment.queueNumber }
        })

        return res.json({
            appointmentId: appointment._id,
            yourQueueNumber: appointment.queueNumber,
            patientsAhead: count
        })

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}
async function addToQueue(req, res) {
  try {
    const { patientId, doctorId } = req.body;

    const lastAppointment = await Appointment.findOne({ doctorId })
      .sort({ queueNumber: -1 });

    const queueNumber = lastAppointment ? lastAppointment.queueNumber + 1 : 1;

    const appointment = await Appointment.create({
      patientId,
      doctorId,
      queueNumber,
      status: "pending",
      date: new Date()
    });

    return res.status(201).json({
      message: "Added to queue",
      appointment
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
}

async function completeCurrent(req, res) {
  try {
    const current = await Appointment.findOne({
      doctorId: req.user.id,
      status: "called",
    });

    if (!current) {
      return res.status(404).json({ message: "No active patient" });
    }

    current.status = "completed";
    await current.save();

    return res.json({
      message: "Patient completed",
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getPatientDetails(req, res) {
  try {
    const { patientId } = req.params;

    // Find the appointment for this doctor and patient
    const appointment = await Appointment.findOne({
      doctorId: req.user.id,
      patientId: patientId,
      status: { $in: ["pending", "approved", "called"] }
    }).populate("patientId", "username age gender email phone");

    if (!appointment) {
      return res.status(404).json({ message: "Patient not found in your queue" });
    }

    return res.status(200).json({
      patient: appointment.patientId,
      appointment: {
        id: appointment._id,
        queueNumber: appointment.queueNumber,
        status: appointment.status,
        date: appointment.date
      }
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = {
    getLiveQueue,
    getCurrentPatient,
    callNextPatient,
    getQueuePosition,
    addToQueue,
    completeCurrent,
    getPatientDetails
}