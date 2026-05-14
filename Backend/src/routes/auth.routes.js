const express = require("express");
const authController = require("../controllers/auth.controllers");
const hospitalController = require("../controllers/hospital.controller");
const authMiddleware = require("../middleware.js/auth.middleware");
const roleMiddleware = require("../middleware.js/role.middleware");
const { authLimiter } = require("../middleware.js/rateLimiter.middleware");

const authRouter = express.Router();

authRouter.post("/register", authLimiter, authController.registerController);

authRouter.post("/login", authLimiter, authController.loginController);

authRouter.post("/logout", authController.logoutController);

authRouter.put(
  "/profile",
  authMiddleware,
  authController.updateProfileController,
);

authRouter.post(
  "/hospital/create-patient",
  authMiddleware,
  roleMiddleware("hospital"),
  hospitalController.hospitalCreatePatient,
);

authRouter.post(
  "/hospital/create-doctor",
  authMiddleware,
  roleMiddleware("hospital"),
  hospitalController.hospitalCreateDoctor,
);

authRouter.get(
  "/patient-dashboard",
  authMiddleware,
  roleMiddleware("patient"),
  (req, res) => {
    res.json({ message: "Welcome Patient" });
  },
);

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

authRouter.get(
  "/patients/:id",
  authMiddleware,
  roleMiddleware("doctor"),
  authController.getPatientById,
);

authRouter.get(
  "/hospital-dashboard",
  authMiddleware,
  roleMiddleware("hospital"),
  (req, res) => {
    res.json({ message: "Welcome Hospital" });
  },
);

module.exports = authRouter;
