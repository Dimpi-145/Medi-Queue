const express = require("express");
const chatRouter = express.Router();

const authMiddleware = require("../middleware.js/auth.middleware");
const roleMiddleware = require("../middleware.js/role.middleware");
const chatController = require("../controllers/chat.controller");

// Send message (both doctor and patient)
chatRouter.post(
  "/send",
  authMiddleware,
  roleMiddleware("doctor", "patient"),
  chatController.sendMessage
);

// Get chat history for a consultation
chatRouter.get(
  "/history/:consultationId",
  authMiddleware,
  roleMiddleware("doctor", "patient"),
  chatController.getChatHistory
);

// Alias route for chat history by appointment id
chatRouter.get(
  "/:appointmentId",
  authMiddleware,
  roleMiddleware("doctor", "patient"),
  chatController.getChatHistory
);

// Get all follow-up consultations (completed appointments)
chatRouter.get(
  "/follow-ups",
  authMiddleware,
  roleMiddleware("doctor", "patient"),
  chatController.getFollowUpConsultations
);

module.exports = chatRouter;
