const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    date: {
      type: String,
      required: true,
    },

    timeSlot: {
      type: String,
    },

    queueNumber: {
      type: Number,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "completed", "cancelled", "rescheduled"],
      default: "pending",
    },
    source: {
      type: String,
      enum: ["walk-in", "online"],
      default: "online",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Appointment", appointmentSchema);
