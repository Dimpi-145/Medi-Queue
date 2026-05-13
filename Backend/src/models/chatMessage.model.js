const mongoose = require("mongoose");

const attachmentSchema =
  new mongoose.Schema(
    {
      filename: {
        type: String,
        default: "",
      },

      originalName: {
        type: String,
        default: "",
      },

      path: {
        type: String,
        default: "",
      },

      url: {
        type: String,
        default: "",
      },

      mimetype: {
        type: String,
        default: "",
      },

      size: {
        type: Number,
        default: 0,
      },
    },
    { _id: false }
  );

const chatMessageSchema =
  new mongoose.Schema(
    {
      appointmentId: {
        type: mongoose.Schema
          .Types.ObjectId,

        ref: "Appointment",

        required: true,
      },

      senderId: {
        type: mongoose.Schema
          .Types.ObjectId,

        ref: "User",

        required: true,
      },

      receiverId: {
        type: mongoose.Schema
          .Types.ObjectId,

        ref: "User",

        required: true,
      },

      senderRole: {
        type: String,

        enum: [
          "doctor",
          "patient",
        ],

        required: true,
      },

      message: {
        type: String,

        default: "",

        trim: true,
      },

      attachment: {
        type: attachmentSchema,

        default: null,
      },
    },
    {
      timestamps: true,
    }
  );

// ================= VALIDATION =================

chatMessageSchema.pre(
  "validate",

  async function () {
    const hasMessage =
      this.message &&
      this.message.trim()
        .length > 0;

    const hasAttachment =
      this.attachment &&
      this.attachment.url;

    if (
      !hasMessage &&
      !hasAttachment
    ) {
      throw new Error(
        "Message or attachment is required"
      );
    }
  }
);

module.exports =
  mongoose.model(
    "ChatMessage",
    chatMessageSchema
  );