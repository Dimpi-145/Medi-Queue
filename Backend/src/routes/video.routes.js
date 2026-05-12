const express = require("express");

const videoRouter = express.Router();

const authMiddleware = require("../middleware.js/auth.middleware");

const roleMiddleware = require("../middleware.js/role.middleware");

const videoController = require("../controllers/video.controller");

// ================= REQUEST VIDEO CONSULTATION =================

videoRouter.post(
  "/request",

  authMiddleware,

  // Allow both patient and doctor to initiate a request
  roleMiddleware("doctor", "patient"),

  videoController.requestVideoConsultation
);

// ================= CANCEL VIDEO CONSULTATION =================

videoRouter.post(
  "/cancel",

  authMiddleware,

  // Allow either party to cancel a pending request
  roleMiddleware("doctor", "patient"),

  videoController.cancelVideoRequest
);

// ================= DOCTOR RESPONDS =================

videoRouter.post(
  "/respond",

  authMiddleware,

  // Allow either party to respond (accept/reject) depending on initiator
  roleMiddleware("doctor", "patient"),

  videoController.respondToVideoRequest
);

// ================= GET ALL VIDEO REQUESTS =================

videoRouter.get(
  "/requests",

  authMiddleware,

  roleMiddleware("doctor"),

  videoController.getVideoRequests
);

// ================= GET VIDEO STATUS =================

videoRouter.get(
  "/status/:appointmentId",

  authMiddleware,

  roleMiddleware(
    "doctor",
    "patient"
  ),

  videoController.getVideoRequestStatus
);

// ================= END VIDEO CALL =================

videoRouter.post(
  "/end",

  authMiddleware,

  roleMiddleware("doctor", "patient"),

  videoController.endVideoCall
);

module.exports = videoRouter;