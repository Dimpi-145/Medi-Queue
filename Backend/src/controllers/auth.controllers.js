const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const authRouter = require("../routes/auth.routes");
const generateToken = require("../utils/jwt");
const ImageKit = require("@imagekit/nodejs");
const Appointment = require("../models/appointment.model");

async function registerController(req, res) {
  try {
    let { username, email, password, gender, age, profileImage } = req.body;

    const isUserAlreadyExists = await userModel.findOne({
      $or: [{ username }, { email }],
    });

    if (isUserAlreadyExists) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // optional image upload
    if (req.file) {
      const client = new ImageKit({
        publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
        urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
      });
      const uploaded = await client.upload({
        file: req.file.buffer,
        fileName: Date.now() + "-profile",
      });

      profileImage = uploaded.url;
    }

    const user = await userModel.create({
      username,
      email,
      password: hashedPassword,
      role: "patient", // 🔥 FIXED
      gender: gender || "others",
      age: age || null,
      profileImage,
    });

    const token = generateToken(user);

    res.cookie("token", token, {
      httpOnly: true,
    });

    res.status(201).json({
      message: "User Registered successfully",
      user: {
        email: user.email,
        username: user.username,
        role: user.role,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
}

async function loginController(req, res) {
  const { username, email, password } = req.body;

  const user = await userModel.findOne({
    $or: [
      {
        username: username,
      },
      {
        email: email,
      },
    ],
  });

  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(401).json({
      message: "Password invalid",
    });
  }

  const token = generateToken(user);

  res.cookie("token", token, {
    httpOnly: true,
  });

  res.status(200).json({
    message: "User login successfully.",
    user: {
      username: user.username,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage,
    },
  });
}

async function getPatientById(req, res) {
  try {
    const { id } = req.params;
    const patient = await userModel.findById(id).select("-password");
    if (!patient || patient.role !== "patient") {
      return res.status(404).json({ message: "Patient not found" });
    }
    res.status(200).json(patient);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
}

async function updateMyProfile(req, res) {
  try {
    const patientId = req.user.id;

    const allowed = [
      "username",
      "email",
      "gender",
      "age",
      "phone",
      "profileImage",
      "password",
    ];
    const updates = {};

    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (updates.password) {
      const hashed = await bcrypt.hash(updates.password, 10);
      updates.password = hashed;
    }

    // If file upload handling is used elsewhere, profileImage can be set from req.file
    if (req.file && !updates.profileImage) {
      // optional: upload to ImageKit like in registerController
    }

    const updated = await userModel
      .findByIdAndUpdate(patientId, updates, {
        new: true,
        runValidators: true,
      })
      .select("-password");

    return res.status(200).json({ message: "Profile updated", user: updated });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
}

module.exports = {
  registerController,
  loginController,
  getPatientById,
  updateMyProfile,
};
