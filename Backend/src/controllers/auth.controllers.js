const userModel = require("../models/user.model");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/jwt");
const ImageKit = require("@imagekit/nodejs");

async function registerController(req, res) {
  try {
    let {
      username,
      hospitalName,
      email,
      password,
      role = "patient",
      gender,
      age,
      profileImage,
    } = req.body;

    const normalizedRole = String(role || "patient").toLowerCase();
    const allowedRoles = ["patient", "hospital"];

    if (!allowedRoles.includes(normalizedRole)) {
      return res.status(400).json({
        message:
          "Registration is only available for patient and hospital accounts",
      });
    }

    if (normalizedRole === "hospital") {
      username = username || hospitalName;
    }

    // Input validation
    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Username, email, and password are required",
      });
    }

    if (normalizedRole === "hospital" && !hospitalName) {
      return res.status(400).json({
        message: "Hospital name is required for hospital registration",
      });
    }

    if (String(password).trim().length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
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
      role: normalizedRole,
      hospitalName: normalizedRole === "hospital" ? hospitalName : undefined,
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
    console.error("Register error");
    res.status(500).json({ message: "Registration failed" });
  }
}

async function loginController(req, res) {
  try {
    const { username, email, password, role, hospitalId } = req.body;
    const normalizedRole = String(role || "")
      .toLowerCase()
      .trim();
    const allowedRoles = ["patient", "doctor", "admin", "hospital"];

    // Input validation
    if (!password || (!username && !email)) {
      return res.status(400).json({
        message: "Username or email and password are required",
      });
    }

    if (!allowedRoles.includes(normalizedRole)) {
      return res.status(400).json({
        message: "Valid role is required",
      });
    }

    const query = {
      role: normalizedRole,
      $or: [{ username }, { email }],
    };

    if (normalizedRole === "doctor" && hospitalId) {
      query.hospitalId = hospitalId;
    }

    const user = await userModel
      .findOne(query)
      .populate("hospitalId", "hospitalName username profileImage");

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials for selected role",
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
        hospitalId: user.hospitalId?._id || user.hospitalId || null,
        hospitalName: user.hospitalId?.hospitalName || null,
        schedule: user.schedule,
      },
    });
  } catch (error) {
    console.error("Login error");
    res.status(500).json({ message: "Login failed" });
  }
}

async function logoutController(req, res) {
  res.clearCookie("token", {
    httpOnly: true,
  });

  res.status(200).json({ message: "Logged out successfully" });
}

async function forgotPasswordController(req, res) {
  try {
    const { identifier, username, email, role, hospitalId, newPassword } =
      req.body;
    const normalizedRole = String(role || "")
      .toLowerCase()
      .trim();
    const accountIdentifier = String(identifier || username || email || "")
      .trim();

    if (!accountIdentifier || !newPassword || !normalizedRole) {
      return res.status(400).json({
        message: "Role, username or email, and new password are required",
      });
    }

    if (!["patient", "doctor", "admin", "hospital"].includes(normalizedRole)) {
      return res.status(400).json({ message: "Valid role is required" });
    }

    if (String(newPassword).trim().length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const query = {
      role: normalizedRole,
      $or: [{ username: accountIdentifier }, { email: accountIdentifier }],
    };

    if (normalizedRole === "doctor" && hospitalId) {
      query.hospitalId = hospitalId;
    }

    const user = await userModel.findOne(query);

    if (!user) {
      return res.status(404).json({
        message: "No account found for the selected role",
      });
    }

    user.password = await bcrypt.hash(String(newPassword).trim(), 10);
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Forgot password error");
    res.status(500).json({ message: "Password reset failed" });
  }
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
    const { username, age, gender, phone, email } = req.body;
    const userId = req.user.id;

    const updates = {};
    if (username) updates.username = username;
    if (age !== undefined) updates.age = age;
    if (gender) updates.gender = gender;
    if (phone) updates.phone = phone;
    if (email) updates.email = email.trim().toLowerCase();
    if (req.body.videoUrl !== undefined) {
      updates.videoUrl = String(req.body.videoUrl || "").trim();
    }

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
    if (error?.code === 11000 && error?.keyPattern?.email) {
      return res.status(409).json({
        message: "Email is already in use",
      });
    }

    res.status(500).json({ message: "Server error", error });
  }
}
async function getHospitals(req, res) {
  try {
    const hospitals = await userModel
      .find({
        $or: [
          { role: "hospital" },
          { hospitalName: { $exists: true, $ne: "" } },
        ],
      })
      .select("_id hospitalName username")
      .sort({ hospitalName: 1, username: 1 });

    const formatted = hospitals.map((h) => ({
      _id: h._id,
      name: h.hospitalName || h.username,
      hospitalName: h.hospitalName || null,
      username: h.username || null,
    }));

    res.status(200).json(formatted);
  } catch (error) {
    res.status(500).json({ message: "Error fetching hospitals", error });
  }
}

module.exports = {
  registerController,
  loginController,
  logoutController,
  forgotPasswordController,
  getPatientById,
  updateProfileController,
  getHospitals,
};
