const express = require('express')
const authController = require("../controllers/auth.controllers")
const adminController = require("../controllers/admin.contoller")
const authMiddleware = require("../middleware.js/auth.middleware")
const roleMiddleware = require("../middleware.js/role.middleware")
const appointmentController = require("../controllers/appointment.controller")

const authRouter = express.Router()

/**
 * POST /api/auth/register
 */
authRouter.post('/register', authController.registerController)


/**
 * POST /api/auth/login
 */
authRouter.post('/login', authController.loginController)



 /**
  * Post / api/auth/admin/create-patient
  */
authRouter.post("/admin/create-patient",
  authMiddleware,
  roleMiddleware("admin"),
  adminController.adminCreatePatient
);

/**
 * Post / api/auth/admin/create-doctor
 */
authRouter.post("/admin/create-doctor",
  authMiddleware,
  roleMiddleware("admin"),
  adminController.admincreateDoctor
);

/**
 * Get/api/auth/patient-dashboard
 */
authRouter.get("/patient-dashboard",authMiddleware,roleMiddleware("patient"),
(req, res) => {res.json({ message: "Welcome Patient" })
    }
)

/**
 * GET/ api/auth/admin-dashboard
 */

authRouter.get("/admin-dashboard",authMiddleware,roleMiddleware("admin"),
    (req, res) => {res.json({ message: "Welcome Admin" })
    }
)
/**
 * Get/ api/auth/doctor-dashboard
 */


authRouter.get("/doctor-dashboard", authMiddleware, (req, res) => {
  res.json({ message: "Welcome Doctor", user: req.user });
});

/**
 * GET /api/auth/patients/:id
 */
authRouter.get("/patients/:id", authMiddleware, roleMiddleware("doctor"), authController.getPatientById);

authRouter.put("/profile", authMiddleware, authController.updateProfileController);

module.exports = authRouter;
