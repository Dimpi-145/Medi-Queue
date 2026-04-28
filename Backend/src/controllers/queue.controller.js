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
            queueNumber: nextAppointment.queueNumber
        })

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}
async function getLiveQueue(req, res) {

    console.log("DOCTOR ID:", req.user.id)
    console.log("ROLE:", req.user.role)
    try {
        const { date } = req.query
        const queue = await Appointment.find({
            doctorId: req.user.id,
            status: "pending",
            ...(date && { date })

        }).sort({ queueNumber: 1 })
            .populate("patientId", "username age gender")

        return res.status(200).json({
            doctorId: req.user.id,
            totalWaiting: queue.length,
            patients: queue
        })

    } catch (error) {
        res.status(500).json({ message: error.message })
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

module.exports = {
    getLiveQueue,
    getCurrentPatient,
    callNextPatient,
    getQueuePosition,
    addToQueue
}