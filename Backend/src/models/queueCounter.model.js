const mongoose = require("mongoose");

const queueCounterSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    seq: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

queueCounterSchema.index({ doctorId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("QueueCounter", queueCounterSchema);
