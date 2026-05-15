const mongoose = require("mongoose");

const ReportRequestSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    patientName: { type: String, required: false },
    reportType: { type: String, default: "Other" },
    description: { type: String, default: "" },
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Report",
      required: false,
    },
    status: {
      type: String,
      enum: ["pending", "fulfilled", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ReportRequest", ReportRequestSchema);
