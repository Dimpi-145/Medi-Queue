const express = require("express");

const multer = require("multer");

const path = require("path");

const fs = require("fs");

const chatRouter =
  express.Router();

const authMiddleware =
  require("../middleware.js/auth.middleware");

const roleMiddleware =
  require("../middleware.js/role.middleware");

const chatController =
  require("../controllers/chat.controller");

// ================= UPLOAD DIRECTORY =================

const uploadDir =
  path.join(
    __dirname,
    "../../uploads/chat"
  );

if (
  !fs.existsSync(uploadDir)
) {
  fs.mkdirSync(
    uploadDir,
    {
      recursive: true,
    }
  );
}

// ================= MULTER STORAGE =================

const storage =
  multer.diskStorage({
    destination: (
      req,
      file,
      cb
    ) => {
      cb(
        null,
        uploadDir
      );
    },

    filename: (
      req,
      file,
      cb
    ) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(
        Math.random() *
          1e9
      )}`;

      cb(
        null,
        `${uniqueSuffix}${path.extname(
          file.originalname
        )}`
      );
    },
  });

// ================= FILE FILTER =================

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

const fileFilter = (
  req,
  file,
  cb
) => {
  if (
    allowedMimes.includes(
      file.mimetype
    )
  ) {
    return cb(
      null,
      true
    );
  }

  return cb(
    new Error(
      "Invalid file type. Only images, PDFs, and documents are allowed."
    )
  );
};

// ================= MULTER INSTANCE =================

const upload = multer({
  storage,

  fileFilter,

  limits: {
    fileSize:
      10 * 1024 * 1024,
  },
});

// ================= SEND TEXT MESSAGE =================

chatRouter.post(
  "/send",

  authMiddleware,

  roleMiddleware(
    "doctor",
    "patient"
  ),

  chatController.sendMessage
);

// ================= SEND FILE MESSAGE =================

chatRouter.post(
  "/send-with-file",

  authMiddleware,

  roleMiddleware(
    "doctor",
    "patient"
  ),

  upload.single("file"),

  chatController.sendMessageWithFile
);

// ================= CHAT HISTORY =================

// Primary route
chatRouter.get(
  "/history/:consultationId",

  authMiddleware,

  roleMiddleware(
    "doctor",
    "patient"
  ),

  chatController.getChatHistory
);

// Alias route
chatRouter.get(
  "/:consultationId",

  authMiddleware,

  roleMiddleware(
    "doctor",
    "patient"
  ),

  chatController.getChatHistory
);

// ================= FOLLOW-UP CONSULTATIONS =================

chatRouter.get(
  "/follow-ups",

  authMiddleware,

  roleMiddleware(
    "doctor",
    "patient"
  ),

  chatController.getFollowUpConsultations
);

module.exports =
  chatRouter;