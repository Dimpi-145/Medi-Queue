const express = require("express")
const DashboardRouter = express.Router()

const dashboardController = require("../controllers/dashboard.controller")
const authMiddleware = require("../middleware.js/auth.middleware")
const roleMiddleware = require("../middleware.js/role.middleware")

DashboardRouter.get(
    "/doctor",
    authMiddleware,
    roleMiddleware("doctor"),
    dashboardController.doctorDashboard
)
DashboardRouter.get(
    "/patient",
    authMiddleware,
    roleMiddleware("patient"),
    dashboardController.patientDashboard
)

module.exports = DashboardRouter