const Appointment = require("../models/appointment.model")

async function bookAppointment(req, res) {
    try {
        const { doctorId, date, timeSlot } = req.body


        // ✅ 1. CHECK DUPLICATE (ADD HERE)
        const existingAppointment = await Appointment.findOne({
            patientId: req.user.id,
            doctorId: doctorId,
            date: date,
            status: { $in: ["pending", "approved"] }
        })

        if (existingAppointment) {
            return res.status(400).json({
                message: "You already have an appointment with this doctor on this date",
                timeSlot: timeSlot
            })
        }

        // get last queue number
        const lastAppointment = await Appointment.findOne().sort({ queueNumber: -1 })

        const queueNumber = lastAppointment ? lastAppointment.queueNumber + 1 : 1

        const appointment = await Appointment.create({
            patientId: req.user.id,
            doctorId,
            date,
            timeSlot,
            queueNumber,
            status: 'pending'
        })
        return res.status(201).json({
            message: "Appointment booked successfully",
            appointmentId: appointment._id,   
            appointment
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message
        })
    }
}
async function getMyAppointments(req, res) {
    try {
        const appointments = await Appointment.find({
            patientId: req.user.id
        }).populate("doctorId", "username specialization")

         const formattedAppointments = appointments.map(app => ({
            appointmentId: app._id,   
            doctor: app.doctorId,
            date: app.date,
            timeSlot: app.timeSlot,
            queueNumber: app.queueNumber,
            status: app.status
        }))

        return res.status(200).json(appointments)

    } catch (error) {
        return res.status(500).json({
            message: error.message
        })
    }
}
async function getDoctorAppointments(req, res) {
    try {
        const appointments = await Appointment.find({
            doctorId: req.user.id
        }).populate("patientId", "username age gender")

        const formattedAppointments = appointments.map(app => ({
            appointmentId: app._id,   
            patient: app.patientId,
            date: app.date,
            timeSlot: app.timeSlot,
            queueNumber: app.queueNumber,
            status: app.status
        }))


        return res.status(200).json(appointments)

    } catch (error) {
        return res.status(500).json({
            message: error.message
        })
    }
}
async function cancelAppointment(req, res) {
    try {
        const appointment = await Appointment.findById(req.params.id)

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" })
        }

        if (appointment.patientId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not allowed" })
        }

        appointment.status = "cancelled"
        await appointment.save()

        return res.status(200).json({
            message: "Appointment cancelled"
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message
        })
    }
}
async function callNextPatient(req, res) {
    try {
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

        return res.json({
            message: "Next patient called",
            appointmentId: nextAppointment._id,
            queueNumber: nextAppointment.queueNumber
        })

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

async function completeAppointment(req, res) {
    try {
        const appointment = await Appointment.findById(req.params.id)

        if (!appointment) {
            return res.status(404).json({ message: "Not found" })
        }

        appointment.status = "completed"
        await appointment.save()

        return res.json({
            message: "Appointment completed"
        })

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}




module.exports = {
    bookAppointment,
    getMyAppointments,
    getDoctorAppointments,
    cancelAppointment,
    callNextPatient,
    completeAppointment,
}