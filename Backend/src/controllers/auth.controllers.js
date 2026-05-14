const userModel = require("../models/user.model");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/jwt");
const ImageKit = require("@imagekit/nodejs");

async function registerController(req, res) {
  try {
    let { username, email, password, gender, age, profileImage } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Username, email, and password are required",
      });
    }

    if (String(password).trim().length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const isUserAlreadyExists = await userModel.findOne({
      $or: [{ username }, { email }],
    });

    if (isUserAlreadyExists) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(String(password).trim(), 10);

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
      role: "patient",
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
        _id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        profileImage: user.profileImage,
      },
      token,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Registration failed" });
  }
}

async function loginController(req, res) {
  try {
    const { username, email, password, role } = req.body;

    if (!password || (!username && !email)) {
      return res.status(400).json({
        message: "Username or email and password are required",
      });
    }

    const query = email ? { email } : { username };
    const user = await userModel.findOne(query);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (role && user.role !== role) {
      return res.status(401).json({
        message: "Invalid role selected",
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
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
}

async function logoutController(req, res) {
  res.clearCookie("token", {
    httpOnly: true,
  });

  res.status(200).json({ message: "Logged out successfully" });
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

async function updateProfileController(req, res) {
  try {
    const { username, age, gender, phone } = req.body;
    const userId = req.user.id;

    const updates = {};
    if (username) updates.username = username;
    if (age !== undefined) updates.age = age;
    if (gender) updates.gender = gender;
    if (phone) updates.phone = phone;

    const updatedUser = await userModel
      .findByIdAndUpdate(userId, updates, { new: true, runValidators: true })
      .select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
}

module.exports = {
  registerController,
  loginController,
  logoutController,
  getPatientById,
  updateProfileController,
};
