const express = require("express");
const PrescriptionRouter = express.Router();

const controller = require("../controllers/prescription.controller");
const auth = require("../middleware.js/auth.middleware");
const role = require("../middleware.js/role.middleware");

// Doctor creates prescription
PrescriptionRouter.post(
  "/create",
  auth,
  role("doctor"),
  controller.createPrescription
);

// Patient gets prescriptions
PrescriptionRouter.get(
  "/my",
  auth,
  role("patient"),
  controller.getPatientPrescriptions
);
// Admin and hospital get all prescriptions
PrescriptionRouter.get(
  "/all",
  auth,
  role("admin","hospital"),
  controller.getPrescriptions
);

module.exports = PrescriptionRouter;