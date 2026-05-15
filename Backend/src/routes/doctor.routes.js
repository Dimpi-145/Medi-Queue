const express = require("express");
const doctorRouter = express.Router();

const authMiddleware = require("../middleware.js/auth.middleware");
const roleMiddleware = require("../middleware.js/role.middleware");
const appointmentController = require("../controllers/appointment.controller");
const reportController = require("../controllers/report.controller");

// GET completed consultation history for logged-in doctor
doctorRouter.get(
  "/history",
  authMiddleware,
  roleMiddleware("doctor"),
  appointmentController.getDoctorHistory,
);

// Doctor: create a report request (to hospital or patient)
doctorRouter.post(
  "/request-report",
  authMiddleware,
  roleMiddleware("doctor"),
  reportController.createReportRequest,
);

// Doctor: list own report requests
doctorRouter.get(
  "/requests",
  authMiddleware,
  roleMiddleware("doctor"),
  reportController.getDoctorRequests,
);

module.exports = doctorRouter;
