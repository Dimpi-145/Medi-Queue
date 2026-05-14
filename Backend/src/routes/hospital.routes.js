const express = require("express");
const hospitalrouter = express.Router();

const authMiddleware = require("../middleware.js/auth.middleware");
const roleMiddleware = require("../middleware.js/role.middleware");
const hospitalmiddleware = require("../middleware.js/hospital.middleware");
const hospitalController = require("../controllers/hospital.controller");

// DASHBOARD STATS
hospitalrouter.get(
  "/stats",
  authMiddleware,
  roleMiddleware("hospital"),
  hospitalController.getDashboardStats
);
hospitalrouter.get(
  "/getpatients",
  authMiddleware,
  roleMiddleware("hospital"),
  hospitalController.getPatients
);
hospitalrouter.get(
  "/getdoctors",
  authMiddleware,
  roleMiddleware("hospital"),
  hospitalController.getDoctors
);

hospitalrouter.get(
  "/appointments",
  authMiddleware,
  roleMiddleware("hospital"),
  hospitalController.getAppointments
);

hospitalrouter.post(
  "/book-appointment",
  authMiddleware,
  roleMiddleware("hospital"),
  hospitalController.hospitalBookAppointment
);

/**
 * POST /api/auth/hospital/create-doctor
 */
hospitalrouter.post(
  "/create-doctor",
  authMiddleware,
  roleMiddleware("hospital"),
  hospitalController.hospitalCreateDoctor
);

/**
 * POST /api/auth/hospital/create-patient
 */
hospitalrouter.post(
  "/create-patient",
  authMiddleware,
  roleMiddleware("hospital"),
  hospitalController.hospitalCreatePatient
);
/**
 * POST /api/auth/hospital/walkin-register
 */
hospitalrouter.post( "/walkin-register",
    authMiddleware,roleMiddleware("hospital"), 
    hospitalController.walkInRegister
);
/**
 * GET /api/auth/hospital/prescriptions
 */

module.exports = hospitalrouter;