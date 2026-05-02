const express = require("express")
const DashboardRouter = express.Router()

const dashboardController = require("../controllers/dashboard.controller")
const authMiddleware = require("../middleware.js/auth.middleware")
const roleMiddleware = require("../middleware.js/role.middleware")

DashboardRouter.get(
    /**
     * GET /api/Dashboard/doctor
     * Doctor dashboard data (appointments, live queue, patient details)
     */
    "/doctor",
    authMiddleware,
    roleMiddleware("doctor"),
    dashboardController.doctorDashboard
)
/**
 * GET /api/Dashboard/patient
 * Patient dashboard data (appointments, queue position, prescriptions)
 */
DashboardRouter.get(
    "/patient",
    authMiddleware,
    roleMiddleware("patient"),
    dashboardController.patientDashboard
)

module.exports = DashboardRouter