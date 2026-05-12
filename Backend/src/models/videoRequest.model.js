const mongoose = require("mongoose");

const videoRequestSchema =
  new mongoose.Schema(
    {
      appointmentId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Appointment",

        required: true,
      },

      doctorId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",

        required: true,
      },

      patientId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",

        required: true,
      },

      // Who initiated the request: 'patient' or 'doctor'
      initiator: {
        type: String,
        enum: ["patient", "doctor"],
        default: "patient",
      },

      status: {
        type: String,

        enum: [
          "pending",
          "accepted",
          "rejected",
          "completed",
          "cancelled",
        ],

        default: "pending",
      },

      roomId: {
        type: String,

        default: null,
      },

      requestedAt: {
        type: Date,

        default: Date.now,
      },

      respondedAt: {
        type: Date,

        default: null,
      },
    },

    {
      timestamps: true,
    }
  );

module.exports = mongoose.model(
  "VideoRequest",
  videoRequestSchema
);