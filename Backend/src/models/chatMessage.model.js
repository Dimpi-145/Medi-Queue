const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },
    consultationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderRole: {
      type: String,
      enum: ["doctor", "patient"],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    attachment: {
      type: {
        filename: String,
        originalName: String,
        path: String,
        url: String,
        mimetype: String,
        size: Number,
      },
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
