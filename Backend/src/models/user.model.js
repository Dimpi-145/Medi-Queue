// KEEP THIS FILE: src/models/user.model.js

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },

    role: {
      type: String,
      enum: ["patient", "doctor", "admin", "hospital"],
      default: "patient",
    },

    hospitalName: {
      type: String,
      trim: true,
    },

    locationUrl: {
      type: String,
      trim: true,
    },

    phone: String,
    gender: {
      type: String,
      enum: ["male", "female", "others"],
    },
    age: Number,
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    specialization: String,
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    department: {
      type: String,
      enum: [
        "General",
        "Cardiology",
        "Neurology",
        "Orthopedics",
        "Dermatology",
        "Pediatrics",
        "ENT",
      ],
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    profileImage: {
      type: String,
      default:
        "https://ik.imagekit.io/in2kqh3ai/cohort-2-insta-clone-posts/images.png",
    },

    // Weekly schedule and today's active status for doctors
    schedule: {
      weekly: [
        {
          day: { type: String },
          start: { type: String },
          end: { type: String },
        },
      ],
      isActiveToday: { type: Boolean, default: false },
      todayStart: { type: String },
      todayEnd: { type: String },
    },
  },
  {
    timestamps: true,
  },
);

// Compound unique indexes: username + hospitalId for doctors, email + hospitalId for multi-hospital usage
// For patients, admins, and hospitals (non-doctor roles), username and email are globally unique
userSchema.index(
  { username: 1, hospitalId: 1 },
  { unique: true, sparse: true, name: "username_hospitalId_unique" },
);
userSchema.index(
  { email: 1, hospitalId: 1 },
  { unique: true, sparse: true, name: "email_hospitalId_unique" },
);

// Global unique index for non-doctor users
userSchema.index(
  { username: 1, role: 1 },
  { unique: true, sparse: true, name: "username_role_unique" },
);
userSchema.index(
  { email: 1 },
  { unique: true, sparse: true, name: "email_unique" },
);

module.exports = mongoose.model("User", userSchema);
