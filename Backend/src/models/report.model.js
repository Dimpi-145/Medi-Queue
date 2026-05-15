const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },

  patientName: {
    type: String,
    trim: true,
  },

  hospitalName: {
    type: String,
    trim: true,
  },

  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },

  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  fileName: {
    type: String,
    required: true,
  },

  fileUrl: {
    type: String,
    required: true,
  },

  fileId: {
    type: String,
  },

  filePath: {
    type: String,
  },

  storageType: {
    type: String,
    enum: ["imagekit", "local"],
    default: "local",
  },

  localPath: {
    type: String,
  },

  originRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ReportRequest",
    required: false,
  },

  reportType: {
    type: String,
    enum: [
      "Lab Test",
      "X-Ray",
      "CT Scan",
      "Blood Test",
      "ECG",
      "Prescription",
      "Other",
    ],
    default: "Other",
  },

  description: {
    type: String,
    trim: true,
  },

  token: {
    type: String,
    unique: true,
    required: true,
  },

  sharedWith: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      role: {
        type: String,
        enum: ["doctor", "patient"],
      },
      sharedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],

  status: {
    type: String,
    enum: ["active", "archived"],
    default: "active",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Report", reportSchema);
