const Prescription = require("../models/prescription.model");

// ================= CREATE PRESCRIPTION =================
async function createPrescription(req, res) {
  console.log("BODY RECEIVED:", req.body);

  try {
    const doctorId = req.user.id;
    const { patientId, notes, medicines } = req.body;

    const prescription = await Prescription.create({
      doctorId,
      patientId,
      notes,
      medicines,
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
  getPrescriptions
};