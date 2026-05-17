const ReportModel = require("../models/report.model");
const User = require("../models/user.model");
const ReportRequest = require("../models/reportRequest.model");
const generateToken = require("../utils/report.token");
const ImageKit = require("@imagekit/nodejs");
const { toFile } = require("@imagekit/nodejs");
const fs = require("fs");
const path = require("path");

// create ImageKit client when needed
const makeImageKitClient = () =>
  new ImageKit({
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
  });

const reportUploadDir = path.join(__dirname, "..", "..", "uploads", "reports");

const ALLOWED_REPORT_TYPES = [
  "Lab Test",
  "X-Ray",
  "CT Scan",
  "Blood Test",
  "ECG",
  "Prescription",
  "Other",
];

function normalizeReportType(input) {
  if (!input) return "Other";
  const trimmed = String(input).trim();
  const found = ALLOWED_REPORT_TYPES.find(
    (t) => t.toLowerCase() === trimmed.toLowerCase(),
  );
  if (found) return found;
  if (/other/i.test(trimmed)) return "Other";
  if (trimmed.toLowerCase().endsWith("s")) {
    const singular = trimmed.slice(0, -1);
    const found2 = ALLOWED_REPORT_TYPES.find(
      (t) => t.toLowerCase() === singular.toLowerCase(),
    );
    if (found2) return found2;
  }
  return "Other";
}

function getReportStorageType(report) {
  if (report.storageType) return report.storageType;
  return report.fileUrl?.includes("/uploads/reports/") ? "local" : "imagekit";
}

function getFileExtension(fileName = "") {
  return path.extname(fileName || "");
}

function normalizeFileName(inputName, currentFileName = "report") {
  const trimmedName = String(inputName || "").trim();
  if (!trimmedName) return null;
  const currentExtension = getFileExtension(currentFileName);
  const inputExtension = getFileExtension(trimmedName);
  const baseName = (
    inputExtension ? trimmedName.slice(0, -inputExtension.length) : trimmedName
  )
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  const safeBaseName = baseName || "report";
  const extension = inputExtension || currentExtension;
  return `${safeBaseName}${extension}`;
}

function buildImageKitFileUrl(filePath) {
  const endpoint = String(process.env.IMAGEKIT_URL_ENDPOINT || "").replace(
    /\/+$/,
    "",
  );
  return `${endpoint}${filePath}`;
}

function ensureReportUploadDir() {
  fs.mkdirSync(reportUploadDir, { recursive: true });
}

function buildLocalReportUrl(req, filename) {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  return `${baseUrl}/uploads/reports/${filename}`;
}

function saveReportLocally(req, file, sanitizedName) {
  ensureReportUploadDir();
  const localFileName = `${Date.now()}-${sanitizedName}`;
  const localFilePath = path.join(reportUploadDir, localFileName);
  fs.writeFileSync(localFilePath, file.buffer);
  return {
    url: buildLocalReportUrl(req, localFileName),
    fileId: localFileName,
    filePath: localFileName,
    storageType: "local",
    localPath: localFilePath,
  };
}

async function removeStoredReportFile(req, report) {
  const storageType = getReportStorageType(report);
  if (storageType === "local") {
    const localName = report.localPath
      ? path.basename(report.localPath)
      : path.basename(report.fileUrl || report.fileName || "");
    const localPath = report.localPath || path.join(reportUploadDir, localName);
    if (localPath && fs.existsSync(localPath)) fs.unlinkSync(localPath);
    return;
  }
  if (!report.fileId)
    throw new Error(
      "Cannot delete this report because its ImageKit fileId is missing",
    );
  const client = makeImageKitClient();
  await client.files.delete(report.fileId);
}

// ================= UPLOAD REPORT =================
async function uploadReport(req, res) {
  try {
    const patientId = req.user.id;
    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: "No report file uploaded" });

    const file = req.file;
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes)
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 5MB",
      });

    const client = makeImageKitClient();
    let uploadedFile;
    const sanitizedName = file.originalname
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .toLowerCase();

    try {
      const uploadableFile = await toFile(file.buffer, sanitizedName);
      const ikRes = await client.files.upload({
        file: uploadableFile,
        fileName: `${Date.now()}-${sanitizedName}`,
      });
      uploadedFile = {
        url: ikRes.url,
        fileId: ikRes.fileId,
        filePath: ikRes.filePath,
        storageType: "imagekit",
      };
    } catch (ikError) {
      uploadedFile = saveReportLocally(req, file, sanitizedName);
    }

    if (!uploadedFile || !uploadedFile.url)
      return res
        .status(500)
        .json({ success: false, message: "ImageKit upload failed" });

    const normalizedFileName =
      normalizeFileName(
        req.body.fileName || file.originalname,
        file.originalname,
      ) ||
      String(file.originalname || "report").replace(/[^a-zA-Z0-9._-]/g, "_");
    const reportType = normalizeReportType(req.body.reportType);
    const description = req.body.description || "";
    const hospitalName = String(req.body.hospitalName || "").trim();

    const report = await ReportModel.create({
      patientId,
      hospitalId: req.user?.hospitalId || null,
      hospitalName: hospitalName || null,
      fileName: normalizedFileName,
      fileUrl: uploadedFile.url,
      fileId: uploadedFile.fileId,
      filePath: uploadedFile.filePath,
      storageType: uploadedFile.storageType,
      localPath: uploadedFile.localPath,
      reportType,
      description,
      token: generateToken(),
    });

    return res.status(201).json({
      success: true,
      message: "Report uploaded successfully",
      data: report,
    });
  } catch (err) {
    console.error("REPORT UPLOAD ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Server error during upload",
    });
  }
}

// // ================= GET MY REPORTS =================
async function getMyReports(req, res) {
  try {
    const patientId = req.user.id;
    const reports = await ReportModel.find({ patientId }).sort({
      createdAt: -1,
    });
    return res.status(200).json({ success: true, data: reports });
  } catch (err) {
    console.error("GET MY REPORTS ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Server error fetching reports",
    });
  }
}

// // ================= GET REPORT BY TOKEN =================
async function getReportByToken(req, res) {
  try {
    const { token } = req.params;
    const report = await ReportModel.findOne({ token }).populate(
      "patientId",
      "username",
    );
    if (!report)
      return res.status(404).json({ success: false, message: "Invalid token" });
    return res.status(200).json({ success: true, data: report });
  } catch (err) {
    console.error("GET REPORT BY TOKEN ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Server error fetching report",
    });
  }
}

// // ================= RENAME REPORT =================
async function renameReport(req, res) {
  try {
    const patientId = req.user.id;
    const { id } = req.params;
    const { newFileName } = req.body;
    const report = await ReportModel.findOne({ _id: id, patientId });
    if (!report)
      return res
        .status(404)
        .json({ success: false, message: "Report not found" });
    const safeNewName = normalizeFileName(newFileName, report.fileName);
    if (!safeNewName)
      return res
        .status(400)
        .json({ success: false, message: "Please provide a valid file name" });
    const storageType = getReportStorageType(report);
    if (storageType === "local") {
      const currentLocalName = report.localPath
        ? path.basename(report.localPath)
        : path.basename(report.fileUrl);
      const currentLocalPath =
        report.localPath || path.join(reportUploadDir, currentLocalName);
      const nextLocalPath = path.join(reportUploadDir, safeNewName);
      if (!fs.existsSync(currentLocalPath))
        return res.status(404).json({
          success: false,
          message: "Local report file not found on server",
        });
      fs.renameSync(currentLocalPath, nextLocalPath);
      report.fileName = safeNewName;
      report.fileId = safeNewName;
      report.filePath = safeNewName;
      report.localPath = nextLocalPath;
      report.fileUrl = buildLocalReportUrl(req, safeNewName);
      await report.save();
      return res.status(200).json({
        success: true,
        message: "Report renamed successfully",
        data: report,
      });
    }
    if (!report.filePath)
      return res.status(400).json({
        success: false,
        message:
          "Cannot rename this report because its ImageKit file path is missing",
      });
    const client = makeImageKitClient();
    await client.files.rename({
      filePath: report.filePath,
      newFileName: safeNewName,
      purgeCache: true,
    });
    const nextFilePath = path.posix.join(
      path.posix.dirname(report.filePath),
      safeNewName,
    );
    report.fileName = safeNewName;
    report.filePath = nextFilePath;
    report.fileUrl = buildImageKitFileUrl(nextFilePath);
    await report.save();
    return res.status(200).json({
      success: true,
      message: "Report renamed successfully",
      data: report,
    });
  } catch (err) {
    console.error("RENAME REPORT ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Server error renaming report",
    });
  }
}

// // ================= DELETE REPORT =================
async function deleteReport(req, res) {
  try {
    const patientId = req.user.id;
    const { id } = req.params;
    const report = await ReportModel.findOne({ _id: id, patientId });
    if (!report)
      return res
        .status(404)
        .json({ success: false, message: "Report not found" });
    try {
      await removeStoredReportFile(req, report);
    } catch (storageError) {
      console.error("DELETE REPORT STORAGE ERROR:", storageError);
      return res.status(500).json({
        success: false,
        message: storageError.message || "Failed to delete stored report file",
      });
    }
    await ReportModel.deleteOne({ _id: report._id });
    return res
      .status(200)
      .json({ success: true, message: "Report deleted successfully" });
  } catch (err) {
    console.error("DELETE REPORT ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Server error deleting report",
    });
  }
}

// ================= HOSPITAL: CREATE REPORT FOR PATIENT =================
async function createHospitalReport(req, res) {
  try {
    const hospitalId = req.user.id;
    const {
      patientId,
      patientName,
      fileName,
      reportType,
      description,
      doctorId,
    } = req.body;
    if (!req.file)
      return res.status(400).json({ message: "No report file uploaded" });
    if (!patientId && !patientName)
      return res.status(400).json({ message: "Patient name is required" });
    const trimmedPatientName = String(patientName || "").trim();
    let resolvedPatientId = patientId || null;
    if (!resolvedPatientId && trimmedPatientName) {
      const escapedName = trimmedPatientName.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&",
      );
      const patientQuery = {
        role: "patient",
        username: new RegExp(`^${escapedName}$`, "i"),
      };
      if (req.user && req.user.role === "hospital")
        patientQuery.hospitalId = hospitalId;
      const patient = await User.findOne(patientQuery).select("_id");
      resolvedPatientId = patient?._id || null;
    }
    const file = req.file;
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes)
      return res
        .status(400)
        .json({ message: "File too large. Maximum size is 5MB" });
    const normalizedFileName =
      normalizeFileName(fileName || file.originalname, file.originalname) ||
      String(file.originalname || "report").replace(/[^a-zA-Z0-9._-]/g, "_");
    const savedFile = saveReportLocally(req, file, normalizedFileName);
    const report = await ReportModel.create({
      patientId: resolvedPatientId,
      patientName: trimmedPatientName || null,
      hospitalId,
      doctorId: doctorId || null,
      fileName: normalizedFileName,
      fileUrl: savedFile.url,
      fileId: savedFile.fileId,
      filePath: savedFile.filePath,
      storageType: savedFile.storageType,
      localPath: savedFile.localPath,
      reportType: normalizeReportType(reportType),
      description: description || "",
      token: generateToken(),
      sharedWith: [],
    });
    return res
      .status(201)
      .json({ message: "Report created successfully", data: report });
  } catch (err) {
    console.error("CREATE HOSPITAL REPORT ERROR:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
}

// ================= HOSPITAL: GET ALL REPORTS =================
async function getHospitalReports(req, res) {
  try {
    const hospitalId = req.user.id;
    const reports = await ReportModel.find({ hospitalId })
      .populate("patientId", "username email")
      .populate("doctorId", "username specialization")
      .sort({ createdAt: -1 });
    return res.status(200).json({ data: reports, total: reports.length });
  } catch (err) {
    console.error("GET HOSPITAL REPORTS ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
}

// ================= HOSPITAL: SHARE REPORT WITH DOCTOR =================
async function shareReportWithDoctor(req, res) {
  try {
    const hospitalId = req.user.id;
    const { reportId, doctorId } = req.body;
    if (!reportId || !doctorId)
      return res
        .status(400)
        .json({ message: "Report ID and Doctor ID are required" });
    const report = await ReportModel.findOne({ _id: reportId, hospitalId });
    if (!report) return res.status(404).json({ message: "Report not found" });
    const alreadyShared = report.sharedWith.some(
      (s) => String(s.userId) === String(doctorId) && s.role === "doctor",
    );
    if (!alreadyShared) {
      report.sharedWith.push({
        userId: doctorId,
        role: "doctor",
        sharedAt: new Date(),
      });
      await report.save();
    }
    return res.status(200).json({
      message: "Report shared with doctor successfully",
      data: report,
    });
  } catch (err) {
    console.error("SHARE REPORT WITH DOCTOR ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
}

// ================= HOSPITAL: SHARE REPORT WITH PATIENT =================
async function shareReportWithPatient(req, res) {
  try {
    const hospitalId = req.user.id;
    const { reportId, patientId } = req.body;
    if (!reportId || !patientId)
      return res
        .status(400)
        .json({ message: "Report ID and Patient ID are required" });
    const report = await ReportModel.findOne({ _id: reportId, hospitalId });
    if (!report) return res.status(404).json({ message: "Report not found" });
    const patient = await User.findOne({
      _id: patientId,
      role: "patient",
      hospitalId,
    }).select("_id");
    if (!patient)
      return res
        .status(404)
        .json({ message: "Patient not found in this hospital" });
    const alreadyShared = report.sharedWith.some(
      (s) => String(s.userId) === String(patient._id) && s.role === "patient",
    );
    if (!alreadyShared) {
      report.sharedWith.push({
        userId: patient._id,
        role: "patient",
        sharedAt: new Date(),
      });
      await report.save();
    }
    return res.status(200).json({
      message: "Report shared with patient successfully",
      data: report,
    });
  } catch (err) {
    console.error("SHARE REPORT WITH PATIENT ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
}

// ================= GET SHARED REPORTS (DOCTOR VIEW) =================
async function getSharedReports(req, res) {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const reports = await ReportModel.find({
      "sharedWith.userId": userId,
      "sharedWith.role": userRole,
    })
      .populate("patientId", "username email")
      .populate("hospitalId", "hospitalName")
      .sort({ createdAt: -1 });
    return res.status(200).json({ data: reports, total: reports.length });
  } catch (err) {
    console.error("GET SHARED REPORTS ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
}

// ================= DOCTOR: CREATE REPORT REQUEST =================
async function createReportRequest(req, res) {
  try {
    const doctorId = req.user.id;
    const { hospitalId, patientId, patientName, reportType, description } =
      req.body;
    if (!hospitalId && !patientId && !patientName)
      return res
        .status(400)
        .json({ message: "Provide hospital or patient info" });
    const trimmedPatientName = String(patientName || "").trim();
    let resolvedPatientId = patientId || null;
    if (!resolvedPatientId && trimmedPatientName) {
      const escapedName = trimmedPatientName.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&",
      );
      const patient = await User.findOne({
        role: "patient",
        username: new RegExp(`^${escapedName}$`, "i"),
      }).select("_id");
      resolvedPatientId = patient?._id || null;
    }
    const request = await ReportRequest.create({
      doctorId,
      hospitalId: hospitalId || null,
      patientId: resolvedPatientId,
      patientName: trimmedPatientName || null,
      reportType: normalizeReportType(reportType),
      description: description || "",
      status: "pending",
    });
    return res.status(201).json({ message: "Request created", data: request });
  } catch (err) {
    console.error("CREATE REPORT REQUEST ERROR:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
}

// ================= DOCTOR: GET OWN REQUESTS =================
async function getDoctorRequests(req, res) {
  try {
    const doctorId = req.user.id;
    const requests = await ReportRequest.find({ doctorId })
      .populate("hospitalId", "hospitalName username")
      .populate(
        "reportId",
        "fileName fileUrl createdAt reportType hospitalName",
      )
      .sort({ createdAt: -1 });
    return res.status(200).json({ data: requests, total: requests.length });
  } catch (err) {
    console.error("GET DOCTOR REQUESTS ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
}

// ================= HOSPITAL: GET REQUESTS TARGETED TO IT =================
async function getHospitalReportRequests(req, res) {
  try {
    const hospitalId = req.user.id;
    const requests = await ReportRequest.find({ hospitalId })
      .populate("doctorId", "username email")
      .populate("patientId", "username email")
      .populate(
        "reportId",
        "fileName fileUrl createdAt reportType hospitalName",
      )
      .sort({ createdAt: -1 });
    return res.status(200).json({ data: requests, total: requests.length });
  } catch (err) {
    console.error("GET HOSPITAL REPORT REQUESTS ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
}

// ================= PATIENT: GET REQUESTS TARGETED TO THEM =================
async function getPatientReportRequests(req, res) {
  try {
    const patientId = req.user.id;
    const patient = req.user;
    const requests = await ReportRequest.find({
      $or: [
        { patientId },
        { patientName: patient?.username, hospitalId: null },
      ],
    })
      .populate("doctorId", "username email specialization")
      .populate("hospitalId", "hospitalName username")
      .populate(
        "reportId",
        "fileName fileUrl createdAt reportType hospitalName",
      )
      .sort({ createdAt: -1 });
    return res.status(200).json({ data: requests, total: requests.length });
  } catch (err) {
    console.error("GET PATIENT REPORT REQUESTS ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
}

// ================= HOSPITAL: FULFILL REPORT REQUEST =================
async function fulfillHospitalReportRequest(req, res) {
  try {
    const hospitalId = req.user.id;
    const { requestId } = req.params;
    if (!req.file)
      return res.status(400).json({ message: "No report file uploaded" });
    const request = await ReportRequest.findOne({ _id: requestId, hospitalId });
    if (!request)
      return res.status(404).json({ message: "Report request not found" });
    const file = req.file;
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes)
      return res
        .status(400)
        .json({ message: "File too large. Maximum size is 5MB" });
    const trimmedPatientName = String(request.patientName || "").trim();
    let resolvedPatientId = request.patientId || null;
    if (!resolvedPatientId && trimmedPatientName) {
      const escapedName = trimmedPatientName.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&",
      );
      const patientQuery = {
        role: "patient",
        username: new RegExp(`^${escapedName}$`, "i"),
        hospitalId,
      };
      const patient = await User.findOne(patientQuery).select("_id");
      resolvedPatientId = patient?._id || null;
    }
    const normalizedFileName =
      normalizeFileName(
        req.body.fileName || file.originalname,
        file.originalname,
      ) ||
      String(file.originalname || "report").replace(/[^a-zA-Z0-9._-]/g, "_");
    const savedFile = saveReportLocally(req, file, normalizedFileName);
    const report = await ReportModel.create({
      patientId: resolvedPatientId,
      patientName: trimmedPatientName || null,
      hospitalId,
      doctorId: request.doctorId || null,
      fileName: normalizedFileName,
      fileUrl: savedFile.url,
      fileId: savedFile.fileId,
      filePath: savedFile.filePath,
      storageType: savedFile.storageType,
      localPath: savedFile.localPath,
      originRequestId: request._id,
      reportType: normalizeReportType(request.reportType),
      description: request.description || "",
      token: generateToken(),
      sharedWith: request.doctorId
        ? [{ userId: request.doctorId, role: "doctor", sharedAt: new Date() }]
        : [],
    });
    request.status = "fulfilled";
    request.reportId = report._id;
    await request.save();
    try {
      const io = req.app.get("io");
      if (io && request.doctorId) {
        const targetId = String(request.doctorId._id || request.doctorId);
        io.to(targetId).emit("sharedReportReceived", {
          report,
          requestId: request._id,
        });
      }
    } catch (emitErr) {
      console.error("SHARED REPORT EMIT ERROR:", emitErr);
    }
    return res.status(201).json({
      message: "Report request fulfilled successfully",
      data: { request, report },
    });
  } catch (err) {
    console.error("FULFILL HOSPITAL REPORT REQUEST ERROR:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
}

// ================= PATIENT: FULFILL REPORT REQUEST =================
async function fulfillPatientReportRequest(req, res) {
  try {
    const patientId = req.user.id;
    const patient = req.user;
    const { requestId } = req.params;
    if (!req.file)
      return res.status(400).json({ message: "No report file uploaded" });
    const request = await ReportRequest.findOne({
      _id: requestId,
      $or: [{ patientId }, { patientName: patient?.username }],
    }).populate("doctorId", "username email specialization hospitalId");
    if (!request)
      return res.status(404).json({ message: "Report request not found" });
    const file = req.file;
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes)
      return res
        .status(400)
        .json({ message: "File too large. Maximum size is 5MB" });
    const hospitalId =
      req.user.hospitalId || request.hospitalId || request.doctorId?.hospitalId;
    if (!hospitalId)
      return res.status(400).json({
        message:
          "This patient account is not linked to a hospital, so the report cannot be saved yet",
      });
    const normalizedFileName =
      normalizeFileName(
        req.body.fileName || file.originalname,
        file.originalname,
      ) ||
      String(file.originalname || "report").replace(/[^a-zA-Z0-9._-]/g, "_");
    const savedFile = saveReportLocally(req, file, normalizedFileName);
    const report = await ReportModel.create({
      patientId,
      patientName: patient?.username || null,
      hospitalId,
      doctorId: request.doctorId?._id || request.doctorId || null,
      fileName: normalizedFileName,
      fileUrl: savedFile.url,
      fileId: savedFile.fileId,
      filePath: savedFile.filePath,
      storageType: savedFile.storageType,
      localPath: savedFile.localPath,
      originRequestId: request._id,
      reportType: normalizeReportType(request.reportType),
      description: request.description || "",
      token: generateToken(),
      sharedWith: request.doctorId
        ? [
            {
              userId: request.doctorId._id || request.doctorId,
              role: "doctor",
              sharedAt: new Date(),
            },
          ]
        : [],
    });
    request.status = "fulfilled";
    request.reportId = report._id;
    await request.save();
    try {
      const io = req.app.get("io");
      if (io && request.doctorId) {
        const targetId = String(request.doctorId._id || request.doctorId);
        io.to(targetId).emit("sharedReportReceived", {
          report,
          requestId: request._id,
        });
      }
    } catch (emitErr) {
      console.error("SHARED REPORT EMIT ERROR:", emitErr);
    }
    return res.status(201).json({
      message: "Report request fulfilled successfully",
      data: { request, report },
    });
  } catch (err) {
    console.error("FULFILL PATIENT REPORT REQUEST ERROR:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
}

// ================= GET REPORT FILE BY ID (STREAM OR REDIRECT) =================
async function getReportFile(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user && req.user.id;

    const report = await ReportModel.findById(id);
    if (!report) return res.status(404).json({ message: "Report not found" });

    // Basic permission check: allow owner, hospital that owns it, or if shared
    const isOwner =
      report.patientId && String(report.patientId) === String(userId);
    const isHospital =
      req.user &&
      req.user.role === "hospital" &&
      String(req.user.id) === String(report.hospitalId);
    const isShared =
      Array.isArray(report.sharedWith) &&
      report.sharedWith.some((s) => String(s.userId) === String(userId));

    if (!isOwner && !isHospital && !isShared) {
      return res
        .status(403)
        .json({ message: "Access denied to this report file" });
    }

    const storageType = getReportStorageType(report);

    if (storageType === "local") {
      const localName = report.localPath
        ? path.basename(report.localPath)
        : path.basename(report.fileUrl || report.fileName || "");
      const localPath =
        report.localPath || path.join(reportUploadDir, localName);
      if (!localPath || !fs.existsSync(localPath)) {
        return res
          .status(404)
          .json({ message: "Report file not found on server" });
      }
      return res.sendFile(localPath);
    }

    // For ImageKit / remote URLs, redirect to the fileUrl so client can fetch directly
    if (report.fileUrl) {
      return res.redirect(report.fileUrl);
    }

    return res
      .status(404)
      .json({ message: "No file available for this report" });
  } catch (err) {
    console.error("GET REPORT FILE ERROR:", err);
    return res
      .status(500)
      .json({ message: err.message || "Server error fetching report file" });
  }
}

module.exports = {
  uploadReport,
  getMyReports,
  getReportByToken,
  renameReport,
  deleteReport,
  createHospitalReport,
  getHospitalReports,
  shareReportWithDoctor,
  shareReportWithPatient,
  getSharedReports,
  createReportRequest,
  getDoctorRequests,
  getHospitalReportRequests,
  getPatientReportRequests,
  fulfillHospitalReportRequest,
  fulfillPatientReportRequest,
  getReportFile,
};
