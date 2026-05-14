const express = require("express");
const ReportRouter = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const reportController = require("../controllers/report.controller");
const auth = require("../middleware.js/auth.middleware");
const role = require("../middleware.js/role.middleware");

// Patient uploads report
ReportRouter.post(
  "/upload",
  upload.single("report"),
  auth,
  role("patient"),
  reportController.uploadReport,
);

// Patient gets own reports
ReportRouter.get("/my", auth, role("patient"), reportController.getMyReports);

// Patient renames own report
ReportRouter.patch(
  "/:id/rename",
  auth,
  role("patient"),
  reportController.renameReport,
);

// Patient deletes own report
ReportRouter.delete(
  "/:id",
  auth,
  role("patient"),
  reportController.deleteReport,
);

// Doctor views via token
ReportRouter.get(
  "/view/:token",
  auth,
  role("doctor"),
  reportController.getReportByToken,
);

// Admin and hospital get all reports
ReportRouter.get(
  "/all",
  auth,
  role("admin","hospital"),
  reportController.getAllReports,
);

module.exports = ReportRouter;
