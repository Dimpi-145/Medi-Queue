const express = require("express");
const adminrouter = express.Router();

const authMiddleware = require("../middleware.js/auth.middleware");
const roleMiddleware = require("../middleware.js/role.middleware");
const adminController = require("../controllers/admin.contoller");

// DASHBOARD STATS
adminrouter.get(
  "/stats",
  authMiddleware,
  roleMiddleware("admin"),
  adminController.getDashboardStats
);
adminrouter.get(
  "/getpatients",
  authMiddleware,
  roleMiddleware("admin"),
  adminController.getPatients
);
adminrouter.get(
  "/getdoctors",
  authMiddleware,
  roleMiddleware("admin"),
  adminController.getDoctors
);

adminrouter.get(
  "/appointments",
  authMiddleware,
  roleMiddleware("admin"),
  adminController.getAppointments
);

adminrouter.post(
  "/book-appointment",
  authMiddleware,
  roleMiddleware("admin"),
  adminController.adminBookAppointment
);

/**
 * POST /api/auth/admin/create-doctor
 */
adminrouter.post(
  "/create-doctor",
  authMiddleware,
  roleMiddleware("admin"),
  adminController.admincreateDoctor
);

/**
 * POST /api/admin/create-patient
 */
adminrouter.post(
  "/create-patient",
  authMiddleware,
  roleMiddleware("admin"),
  adminController.adminCreatePatient
);
/**
 * POST /api/auth/admin/walkin-register
 */
adminrouter.post( "/walkin-register",
    authMiddleware,roleMiddleware("admin"), 
    adminController.walkInRegister
);
/**
 * GET /api/auth/admin/prescriptions
 */

module.exports = adminrouter;