const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const chatRouter = express.Router();

const authMiddleware = require("../middleware.js/auth.middleware");
const roleMiddleware = require("../middleware.js/role.middleware");
const chatController = require("../controllers/chat.controller");

// Configure multer for file uploads
const uploadDir = path.join(__dirname, "../../uploads/chat");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  // Allow images, PDFs, and documents
  const allowedMimes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images, PDFs, and documents are allowed."));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Send message (both doctor and patient)
chatRouter.post(
  "/send",
  authMiddleware,
  roleMiddleware("doctor", "patient"),
  chatController.sendMessage
);

// Send message with file attachment
chatRouter.post(
  "/send-with-file",
  authMiddleware,
  roleMiddleware("doctor", "patient"),
  upload.single("file"),
  chatController.sendMessageWithFile
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
