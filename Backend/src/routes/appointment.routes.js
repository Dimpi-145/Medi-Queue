const express = require("express")
const appointmentRouter = express.Router()

const authMiddleware = require("../middleware.js/auth.middleware")
const roleMiddleware = require("../middleware.js/role.middleware")
const appointmentController = require("../controllers/appointment.controller")

const Appointment = require("../models/appointment.model")

// patient book
appointmentRouter.post(
    "/book",
    authMiddleware,
    roleMiddleware("patient"),
    appointmentController.bookAppointment
)

// patient view
appointmentRouter.get(
    "/my",
    authMiddleware,
    roleMiddleware("patient"),
    appointmentController.getMyAppointments
)

// doctor view
appointmentRouter.get(
    "/doctor",
    authMiddleware,
    roleMiddleware("doctor"),
    appointmentController.getDoctorAppointments
)

// cancel
appointmentRouter.put(
    "/cancel/:id",
    authMiddleware,
    roleMiddleware("patient"),
    appointmentController.cancelAppointment
)


appointmentRouter.put(
    "/complete/:id",
    authMiddleware,
    roleMiddleware("doctor"),
    appointmentController.completeAppointment
)




module.exports = appointmentRouter