const User = require("../models/user.model");
const Appointment = require("../models/appointment.model");
const bcrypt = require("bcrypt");
const {
  normalizeAppointmentDate,
  allocateNextQueueNumber,
} = require("../utils/queueNumber.util");
const { broadcastQueueUpdated } = require("../utils/queueEvents.util");

// ================= DASHBOARD STATS =================
async function getDashboardStats(req, res) {
  try {
    const totalPatients = await User.countDocuments({ role: "patient" });
    const totalDoctors = await User.countDocuments({ role: "doctor" });

    const patientsInQueue = await Appointment.countDocuments({
      status: "pending",
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const appointmentsToday = await Appointment.countDocuments({
      date: { $gte: today },
    });

    return res.status(200).json({
      totalPatients,
      totalDoctors,
      patientsInQueue,
      appointmentsToday,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}

// ================= GET PATIENTS =================
async function getPatients(req, res) {
  try {
    const patients = await User.find({ role: "patient" }).select(
      "username email age gender phone doctorId",
    );

    const formatted = patients.map((p) => ({
      _id: p._id,
      username: p.username,
      email: p.email,
      age: p.age,
      gender: p.gender,
      phone: p.phone,
      doctorId: p.doctorId,
    }));

    return res.status(200).json(formatted);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}

async function adminCreatePatient(req, res) {
  try {
    const { username, email, password, age, gender, phone, doctorId } =
      req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: "Username, email, and password are required" });
    }

    if (String(password).trim().length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const hashed = await bcrypt.hash(String(password).trim(), 10);

    const patient = await User.create({
      username,
      email,
      password: hashed,
      role: "patient",
      age,
      gender,
      phone,
      doctorId: doctorId || undefined,
    });

    return res.status(201).json({
      message: "Patient created successfully",
      patient: {
        _id: patient._id,
        username: patient.username,
        email: patient.email,
      },
    });
  } catch (error) {
    console.error("Patient creation error");
    return res.status(500).json({ message: "Failed to create patient" });
  }
}

// GET DOCTORS
async function getDoctors(req, res) {
  try {
    const doctors = await User.find({ role: "doctor" }).select(
      "username email specialization",
    );

    const formatted = doctors.map((d) => ({
      _id: d._id,
      username: d.username,
      email: d.email,
      specialization: d.specialization,
    }));

    return res.status(200).json(formatted);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}
async function admincreateDoctor(req, res) {
  try {
    const { username, email, password, specialization } = req.body;
    const safePassword =
      password && password.length >= 6 ? password : "doctor123";

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Doctor already exists" });
    }

    const hashed = await bcrypt.hash(safePassword, 10);

    const doctor = await User.create({
      username,
      email,
      password: hashed,
      role: "doctor",
      specialization,
    });

    return res.status(201).json({
      message: "Doctor created successfully",
      doctor: {
        _id: doctor._id,
        username: doctor.username,
        email: doctor.email,
        specialization: doctor.specialization,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
async function walkInRegister(req, res) {
  try {
    const { username, email, gender, age, doctorId } = req.body;

    if (!doctorId) {
      return res.status(400).json({
        message: "doctorId is required",
      });
    }

    // 1. Create patient with secure temporary password
    const crypto = require("crypto");
    const tempPassword = crypto.randomBytes(4).toString("hex");
    const patient = await User.create({
      username,
      email,
      role: "patient",
      gender,
      age,
      password: await bcrypt.hash(tempPassword, 10),
    });

    const today = normalizeAppointmentDate(new Date());
    const queueNumber = await allocateNextQueueNumber(doctorId, today);

    const appointment = await Appointment.create({
      patientId: patient._id,
      doctorId,
      queueNumber,
      status: "pending",
      source: "walk-in",
      date: today,
    });

    const io = req.app.get("io");
    await broadcastQueueUpdated(io, {
      doctorId,
      date: today,
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

// ================= GET ALL APPOINTMENTS =================
async function getAppointments(req, res) {
  try {
    const appointments = await Appointment.find({})
      .populate("patientId", "username age gender")
      .populate("doctorId", "username specialization")
      .sort({ date: -1, queueNumber: 1 });

    const formatted = appointments.map((app) => ({
      _id: app._id,
      patient: app.patientId?.username || "Unknown",
      doctor: app.doctorId?.username || "Unknown",
      specialization: app.doctorId?.specialization || "",
      date: app.date,
      timeSlot: app.timeSlot,
      queueNumber: app.queueNumber,
      status: app.status,
      source: app.source,
    }));

    return res.status(200).json(formatted);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}

// ================= ADMIN BOOK APPOINTMENT =================
async function adminBookAppointment(req, res) {
  try {
    const { patientId, doctorId, date, timeSlot } = req.body;

    const normalizedDate = normalizeAppointmentDate(date);

    const existing = await Appointment.findOne({
      patientId,
      doctorId,
      date: normalizedDate,
      timeSlot,
      status: { $in: ["pending", "approved"] },
    });

    if (existing) {
      return res.status(400).json({ message: "Slot already booked" });
    }

    const queueNumber = await allocateNextQueueNumber(doctorId, normalizedDate);

    const appointment = await Appointment.create({
      patientId,
      doctorId,
      date: normalizedDate,
      timeSlot,
      queueNumber,
      status: "pending",
    });

    const io = req.app.get("io");
    await broadcastQueueUpdated(io, {
      doctorId,
      date: normalizedDate,
    });

    return res.status(201).json({
      message: "Appointment booked successfully",
      appointment,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = {
  getDashboardStats,
  getPatients,
  adminCreatePatient,
  walkInRegister,
  getDoctors,
  admincreateDoctor,
  getAppointments,
  adminBookAppointment,
};
