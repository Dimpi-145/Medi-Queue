const Prescription = require("../models/prescription.model");

exports.createPrescription = async (req, res) => {
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

    res.status(201).json(prescription);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPatientPrescriptions = async (req, res) => {
  try {
    console.log("USER:", req.user);
    console.log("PATIENT ID:", req.user?.id);
    const patientId = req.user.id;

    const prescriptions = await Prescription.find({ patientId })
      .populate("doctorId", "username")
      .sort({ createdAt: -1 });

    res.json(prescriptions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};