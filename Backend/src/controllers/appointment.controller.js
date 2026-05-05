const Appointment = require("../models/appointment.model")

// ================= BOOK =================
async function bookAppointment(req, res) {
    try {
        const { doctorId, date, timeSlot } = req.body

        // ✅ CHECK DUPLICATE (date + timeSlot)
        const existingAppointment = await Appointment.findOne({
            patientId: req.user.id,
            doctorId,
            date,
            timeSlot,
            status: { $in: ["pending", "approved"] }
        })

        if (existingAppointment) {
            return res.status(400).json({
                message: "You already booked this slot"
            })
        }

        // ✅ QUEUE PER DOCTOR + DATE
        const lastAppointment = await Appointment.findOne({
            doctorId,
            date
        }).sort({ queueNumber: -1 })

        const queueNumber = lastAppointment ? lastAppointment.queueNumber + 1 : 1

        const appointment = await Appointment.create({
            patientId: req.user.id,
            doctorId,
            date,
            timeSlot,
            queueNumber,
            status: "pending"
        })

        return res.status(201).json({
            message: "Appointment booked successfully",
            appointment
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message
        })
    }
}


// ================= PATIENT =================
async function getMyAppointments(req, res) {
    try {
        const appointments = await Appointment.find({
            patientId: req.user.id
        })
        .populate("doctorId", "username specialization")
        .sort({ date: -1 }) // ✅ latest first

        const formattedAppointments = appointments.map(app => ({
            id: app._id,
            doctor: app.doctorId?.username || "Doctor",
            specialization: app.doctorId?.specialization || "",
            date: app.date,
            timeSlot: app.timeSlot,
            queueNumber: app.queueNumber,
            status: app.status
        }))

        return res.status(200).json(formattedAppointments)

    } catch (error) {
        return res.status(500).json({
            message: error.message
        })
    }
}


// ================= DOCTOR =================
async function getDoctorAppointments(req, res) {
    try {
        const appointments = await Appointment.find({
            doctorId: req.user.id
        })
        .populate("patientId", "username age gender")
        .sort({ queueNumber: 1 }) // queue order

        const formattedAppointments = appointments.map(app => ({
            id: app._id,
            patient: app.patientId,
            date: app.date,
            timeSlot: app.timeSlot,
            queueNumber: app.queueNumber,
            status: app.status
        }))

        return res.status(200).json(formattedAppointments)

    } catch (error) {
        return res.status(500).json({
            message: error.message
        })
    }
}
const User = require("../models/user.model");

// ================= GET DOCTORS =================
async function getDoctors(req, res) {
  try {
    const { department } = req.query;

    const filter = {
      role: "doctor",
    };

    if (department) {
      filter.specialization = department;
    }

    const doctors = await User.find(filter).select(
      "username department specialization"
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


// ================= CALL NEXT =================
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


// ================= COMPLETE =================
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
    getDoctors,
    cancelAppointment,
    callNextPatient,
    completeAppointment,
}