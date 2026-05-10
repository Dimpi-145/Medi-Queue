const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const authRouter = require("../routes/auth.routes");
const generateToken = require("../utils/jwt");
const imagekit = require("../config/imagekit.config");
const Appointment = require("../models/appointment.model");

async function registerController(req, res) {
  try {
    let {
      username,
      email,
      password,
      gender,
      age,
      profileImage,
      role = "patient",
      specialization,
    } = req.body;

    const normalizedRole = role === "doctor" ? "doctor" : "patient";

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
      const client = new imagekit({
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
      role: normalizedRole,
      gender: gender || "others",
      age: age || null,
      specialization:
        normalizedRole === "doctor"
          ? specialization || "General Medicine"
          : undefined,
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
        specialization: user.specialization,
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

async function getMyProfile(req, res) {
  try {
    const user = await userModel.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      user,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}

async function updateMyProfile(req, res) {
  try {
    const allowedFields = [
      "username",
      "email",
      "phone",
      "gender",
      "age",
      "profileImage",
    ];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const user = await userModel
      .findByIdAndUpdate(req.user.id, updates, {
        new: true,
        runValidators: true,
      })
      .select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}

async function getDoctors(req, res) {
  try {
    const doctors = await userModel
      .find({ role: "doctor" })
      .select("username email specialization profileImage");

    return res.status(200).json({
      doctors,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}

async function admincreateDoctor(req, res) {
  const { username, email, password, specialization } = req.body;

  const hashed = await bcrypt.hash(password, 10);

  const doctor = await userModel.create({
    username,
    email,
    password: hashed,
    role: "doctor",
    specialization,
  });

  res.json({ message: "Doctor created", doctor });
}
async function walkInRegister(req, res) {
  try {
    const { username, email, gender, age, doctorId } = req.body;

    if (!doctorId) {
      return res.status(400).json({
        message: "doctorId is required",
      });
    }

    // 1. Create patient (NO PASSWORD for walk-in optional)
    const patient = await userModel.create({
      username,
      email,
      role: "patient",
      gender,
      age,
      password: await bcrypt.hash("walkin123", 10), // default temp password
    });

    // 2. Generate queue number
    const last = await Appointment.findOne({ doctorId }).sort({
      queueNumber: -1,
    });

    const queueNumber = last ? last.queueNumber + 1 : 1;

    // 3. Create appointment (QUEUE ENTRY)
    const appointment = await Appointment.create({
      patientId: patient._id,
      doctorId,
      queueNumber,
      status: "pending",
      source: "walk-in",
      date: new Date(),
    });

    return res.status(201).json({
      message: "Walk-in patient registered and added to queue",
      patient,
      appointment,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}

module.exports = {
  registerController,
  loginController,
  getMyProfile,
  updateMyProfile,
  getDoctors,
  admincreateDoctor,
  walkInRegister,
};
