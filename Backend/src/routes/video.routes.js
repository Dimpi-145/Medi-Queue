const express = require("express");
const videoRouter = express.Router();

const authMiddleware = require("../middleware.js/auth.middleware");
const roleMiddleware = require("../middleware.js/role.middleware");
const videoController = require("../controllers/video.controller");

// Patient requests video consultation
videoRouter.post(
  "/request",
  authMiddleware,
  roleMiddleware("patient"),
  videoController.requestVideoConsultation
);

// Doctor responds to video request
videoRouter.post(
  "/respond",
  authMiddleware,
  roleMiddleware("doctor"),
  videoController.respondToVideoRequest
);

// Get all video requests for doctor
videoRouter.get(
  "/requests",
  authMiddleware,
  roleMiddleware("doctor"),
  videoController.getVideoRequests
);

// Get status of video request for appointment
videoRouter.get(
  "/status/:appointmentId",
  authMiddleware,
  roleMiddleware("doctor", "patient"),
  videoController.getVideoRequestStatus
);

module.exports = videoRouter;
