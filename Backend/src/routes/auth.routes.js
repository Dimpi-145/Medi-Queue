const express = require("express");
const authController = require("../controllers/auth.controllers");
const authMiddleware = require("../middleware.js/auth.middleware");
const roleMiddleware = require("../middleware.js/role.middleware");
const appointmentController = require("../controllers/appointment.controller");

const authRouter = express.Router();

/**
 * POST /api/auth/register
 */

authRouter.post("/register", authController.registerController);

/**
 * POST /api/auth/login
 */

authRouter.post("/login", authController.loginController);

/**
 * Post / api/auth/admin/create-patient
 */

authRouter.post(
  "/admin/create-patient",
  authMiddleware,
  roleMiddleware("admin"),
  (req, res) => {
    res.json({ message: "Patient registered", data: req.body });
  },
);

/**
 * POST /api/auth/admin/create-doctor
 */

authRouter.post(
  "/admin/create-doctor",
  authMiddleware,
  roleMiddleware("admin"),
  authController.admincreateDoctor,
);

/**
 * Get/api/auth/patient-dashboard
 */

authRouter.get(
  "/patient-dashboard",
  authMiddleware,
  roleMiddleware("patient"),
  (req, res) => {
    res.json({ message: "Welcome Patient" });
  },
);

authRouter.get("/me", authMiddleware, authController.getMyProfile);

authRouter.put("/me", authMiddleware, authController.updateMyProfile);

authRouter.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
  });

  return res.status(200).json({
    message: "Logged out successfully",
  });
});

authRouter.get(
  "/doctors",
  authMiddleware,
  roleMiddleware("patient"),
  authController.getDoctors,
);

/**
 * GET/ api/auth/admin-dashboard
 */

authRouter.get(
  "/admin-dashboard",
  authMiddleware,
  roleMiddleware("admin"),
  (req, res) => {
    res.json({ message: "Welcome Admin" });
  },
);

authRouter.get("/doctor-dashboard", authMiddleware, (req, res) => {
  res.json({ message: "Welcome Doctor", user: req.user });
});

authRouter.post(
  "/admin/walkin-register",
  authMiddleware,
  roleMiddleware("admin"),
  authController.walkInRegister,
);

module.exports = authRouter;
