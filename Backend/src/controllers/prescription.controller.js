const fs = require("fs/promises");
const path = require("path");
const { jsPDF } = require("jspdf");

const Prescription = require("../models/prescription.model");
const Appointment = require("../models/appointment.model");
const User = require("../models/user.model");

const prescriptionsDir = path.join(
  __dirname,
  "..",
  "..",
  "uploads",
  "prescriptions",
);

const sanitizeName = (value = "patient") =>
  String(value)
    .trim()
    .replace(/[^a-z0-9_-]+/gi, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "") || "patient";

const buildFileName = (patientName) =>
  `${Date.now()}-${sanitizeName(patientName)}-prescription.pdf`;

const buildFileUrl = (fileName) => `/uploads/prescriptions/${fileName}`;

async function ensurePrescriptionsDir() {
  await fs.mkdir(prescriptionsDir, { recursive: true });
}

async function buildPrescriptionPdf({ patientName, doctorName, notes }) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, 595, 86, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("MediQueue Prescription", 40, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Prepared by the doctor dashboard", 40, 60);

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Patient", 40, 125);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(`Name: ${patientName || "N/A"}`, 40, 150);
  doc.text(`Doctor: Dr. ${doctorName || "Doctor"}`, 40, 172);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Prescription Notes", 40, 230);
  doc.setDrawColor(37, 99, 235);
  doc.line(40, 238, 178, 238);

  doc.setDrawColor(210, 210, 210);
  doc.roundedRect(40, 255, 515, 250, 10, 10, "S");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  const bodyText = doc.splitTextToSize(notes || "No notes provided.", 480);
  doc.text(bodyText, 58, 280);

  return Buffer.from(doc.output("arraybuffer"));
}

// ================= CREATE PRESCRIPTION =================
async function createPrescription(req, res) {
  try {
    const doctorId = req.user.id;
    const { patientId, appointmentId, notes, medicines } = req.body;

    if (!patientId) {
      return res.status(400).json({ message: "patientId is required" });
    }

    const [doctor, patient] = await Promise.all([
      User.findById(doctorId).select("username"),
      User.findById(patientId).select("username"),
    ]);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const appointment = appointmentId
      ? await Appointment.findOne({
          _id: appointmentId,
          doctorId,
          patientId,
        })
      : await Appointment.findOne({ doctorId, patientId }).sort({
          createdAt: -1,
        });

    const pdfBuffer = await buildPrescriptionPdf({
      patientName: patient.username,
      doctorName: doctor?.username || "Doctor",
      notes,
    });

    await ensurePrescriptionsDir();

    const fileName = buildFileName(patient.username);
    const filePath = path.join(prescriptionsDir, fileName);
    await fs.writeFile(filePath, pdfBuffer);
    const fileUrl = buildFileUrl(fileName);

    const prescription = await Prescription.create({
      doctorId,
      patientId,
      appointmentId: appointment?._id || appointmentId || undefined,
      notes,
      medicines,
      fileName,
      fileUrl,
    });

    return res.status(201).json(prescription);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// ================= GET PATIENT PRESCRIPTIONS =================
async function getPatientPrescriptions(req, res) {
  try {
    console.log("USER:", req.user);

    const patientId = req.user.id;

    const prescriptions = await Prescription.find({ patientId })
      .populate("doctorId", "username")
      .populate("appointmentId", "status queueNumber date")
      .sort({ createdAt: -1 });

    return res.json(prescriptions);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
// GET ALL PRESCRIPTIONS (ADMIN)
async function getPrescriptions(req, res) {
  try {
    const prescriptions = await Prescription.find()
      .populate("patientId", "username")
      .populate("doctorId", "username")
      .populate("appointmentId", "status queueNumber date")
      .sort({ createdAt: -1 });

    const formatted = prescriptions.map((p) => ({
      id: p._id,
      patientName: p.patientId?.username,
      doctorName: p.doctorId?.username,
      date: p.createdAt,
      fileName: p.fileName,
      fileUrl: p.fileUrl,
    }));

    res.status(200).json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// ================= EXPORT MODULE =================
module.exports = {
  createPrescription,
  getPatientPrescriptions,
  getPrescriptions,
};
