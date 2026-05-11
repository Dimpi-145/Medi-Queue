const express = require("express");
const doctorRouter = express.Router();

const authMiddleware = require("../middleware.js/auth.middleware");
const roleMiddleware = require("../middleware.js/role.middleware");
const appointmentController = require("../controllers/appointment.controller");

// GET completed consultation history for logged-in doctor
doctorRouter.get(
  "/history",
  authMiddleware,
  roleMiddleware("doctor"),
  appointmentController.getDoctorHistory
);

module.exports = doctorRouter;
