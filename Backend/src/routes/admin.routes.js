const express = require("express");
const adminrouter = express.Router();

const authMiddleware = require("../middleware.js/auth.middleware");
const roleMiddleware = require("../middleware.js/role.middleware");
const adminController = require("../controllers/admin.contoller");

const reportController = require("../controllers/report.controller");
const multer = require("multer");

const adminOrHospital = roleMiddleware("admin", "hospital");
const upload = multer({ storage: multer.memoryStorage() });

// DASHBOARD STATS
adminrouter.get(
  "/stats",
  authMiddleware,
  adminOrHospital,
  adminController.getDashboardStats,
);
adminrouter.get(
  "/getpatients",
  authMiddleware,
  adminOrHospital,
  adminController.getPatients,
);
adminrouter.get(
  "/getdoctors",
  authMiddleware,
  adminOrHospital,
  adminController.getDoctors,
);

adminrouter.get(
  "/appointments",
  authMiddleware,
  adminOrHospital,
  adminController.getAppointments,
);

adminrouter.post(
  "/book-appointment",
  authMiddleware,
  adminOrHospital,
  adminController.adminBookAppointment,
);

/**
 * POST /api/auth/admin/create-doctor
 */
adminrouter.post(
  "/create-doctor",
  authMiddleware,
  adminOrHospital,
  adminController.admincreateDoctor,
);

// DOCTOR SCHEDULE ROUTES
adminrouter.get(
  "/doctor/:doctorId/schedule",
  authMiddleware,
  adminOrHospital,
  adminController.getDoctorSchedule,
);

adminrouter.put(
  "/doctor/:doctorId/schedule",
  authMiddleware,
  adminOrHospital,
  adminController.updateDoctorSchedule,
);

/**
 * POST /api/admin/create-patient
 */
adminrouter.post(
  "/create-patient",
  authMiddleware,
  adminOrHospital,
  adminController.adminCreatePatient,
);
/**
 * POST /api/auth/admin/walkin-register
 */
adminrouter.post(
  "/walkin-register",
  authMiddleware,
  adminOrHospital,
  adminController.walkInRegister,
);
/**
 * GET /api/auth/admin/prescriptions
 */

// HOSPITAL PROFILE ROUTES
adminrouter.get(
  "/hospital-profile",
  authMiddleware,
  adminOrHospital,
  adminController.getHospitalProfile,
);

adminrouter.put(
  "/hospital-profile",
  authMiddleware,
  adminOrHospital,
  adminController.updateHospitalProfile,
);

// GET HOSPITAL DETAILS BY ID (PUBLIC - for doctors/patients to view hospital info)
adminrouter.get(
  "/hospital-details/:hospitalId",
  adminController.getHospitalDetailsById,
);

// HOSPITAL REPORT ROUTES
adminrouter.post(
  "/create-report",
  authMiddleware,
  roleMiddleware("hospital"),
  upload.single("file"),
  reportController.createHospitalReport,
);

adminrouter.get(
  "/reports",
  authMiddleware,
  roleMiddleware("hospital"),
  reportController.getHospitalReports,
);

adminrouter.post(
  "/share-report-doctor",
  authMiddleware,
  roleMiddleware("hospital"),
  reportController.shareReportWithDoctor,
);

adminrouter.post(
  "/share-report-patient",
  authMiddleware,
  roleMiddleware("hospital"),
  reportController.shareReportWithPatient,
);

adminrouter.get(
  "/shared-reports",
  authMiddleware,
  reportController.getSharedReports,
);

// Hospital: view report requests targeted to this hospital
adminrouter.get(
  "/report-requests",
  authMiddleware,
  roleMiddleware("hospital"),
  reportController.getHospitalReportRequests,
);

adminrouter.post(
  "/report-requests/:requestId/fulfill",
  authMiddleware,
  roleMiddleware("hospital"),
  upload.single("file"),
  reportController.fulfillHospitalReportRequest,
);

module.exports = adminrouter;
