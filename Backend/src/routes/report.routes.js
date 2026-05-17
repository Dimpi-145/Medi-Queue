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

// Delete report - allow owner patient or hospital that created the report
ReportRouter.delete(
  "/:id",
  auth,
  role("patient", "hospital"),
  reportController.deleteReport,
);

// Doctor views via token
ReportRouter.get(
  "/view/:token",
  auth,
  role("doctor"),
  reportController.getReportByToken,
);

// Stream or redirect report file by report id (accessible to authorized users)
ReportRouter.get("/:id/file", auth, reportController.getReportFile);

// Patient views incoming report requests
ReportRouter.get(
  "/requests",
  auth,
  role("patient"),
  reportController.getPatientReportRequests,
);

// Patient fulfills a report request by uploading a file
ReportRouter.post(
  "/requests/:requestId/fulfill",
  upload.single("report"),
  auth,
  role("patient"),
  reportController.fulfillPatientReportRequest,
);

module.exports = ReportRouter;
