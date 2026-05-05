// KEEP THIS FILE: src/models/user.model.js

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      required: [true, "Username is required"],
      trim: true,
    },

    email: {
      type: String,
      unique: true,
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
      enum: ["patient", "doctor", "admin"],
      default: "patient",
    },

    phone: String,
    gender: {
      type: String,
      enum: ["male", "female", "others"]
    },
    age: Number,
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    specialization: String,
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
      default: "https://ik.imagekit.io/in2kqh3ai/cohort-2-insta-clone-posts/images.png"
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);