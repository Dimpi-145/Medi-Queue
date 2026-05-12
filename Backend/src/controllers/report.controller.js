const ReportModel = require("../models/report.model");
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

function getReportStorageType(report) {
  if (report.storageType) {
    return report.storageType;
  }

  return report.fileUrl?.includes("/uploads/reports/") ? "local" : "imagekit";
}

function getFileExtension(fileName = "") {
  return path.extname(fileName || "");
}

function normalizeFileName(inputName, currentFileName = "report") {
  const trimmedName = String(inputName || "").trim();

  if (!trimmedName) {
    return null;
  }

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

    if (localPath && fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }

    return;
  }

  if (!report.fileId) {
    throw new Error(
      "Cannot delete this report because its ImageKit fileId is missing",
    );
  }

  const client = makeImageKitClient();
  await client.files.delete(report.fileId);
}

// ================= UPLOAD REPORT =================
async function uploadReport(req, res) {
  try {
    const patientId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No report file uploaded",
      });
    }

    const file = req.file;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No report file uploaded",
      });
    }

    // Check file size (limit to 5MB)
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum size is 5MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
      });
    }

    console.log("Upload Debug Info:");
    console.log("File:", {
      fieldname: file.fieldname,
      originalname: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    });
    console.log("ImageKit Config:", {
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY ? "SET" : "MISSING",
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY ? "SET" : "MISSING",
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
    });

    // Upload to ImageKit using the SDK file helper for the uploaded buffer
    const client = makeImageKitClient();
    let uploadedFile;
    const sanitizedName = file.originalname
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .toLowerCase();

    try {
      console.log("Original filename:", file.originalname);
      console.log("Sanitized filename:", sanitizedName);

      const uploadableFile = await toFile(file.buffer, sanitizedName);

      uploadedFile = await client.files.upload({
        file: uploadableFile,
        fileName: `${Date.now()}-${sanitizedName}`,
      });
      console.log("ImageKit Upload Response:", uploadedFile);

      uploadedFile = {
        url: uploadedFile.url,
        fileId: uploadedFile.fileId,
        filePath: uploadedFile.filePath,
        storageType: "imagekit",
      };
    } catch (ikError) {
      console.error("ImageKit Upload Error:", ikError);
      console.error("Full ImageKit Error Stack:", ikError.stack);
      if (ikError?.error)
        console.error("ImageKit error object:", ikError.error);
      if (ikError?.status) console.error("ImageKit status:", ikError.status);
      if (ikError?.response)
        console.error("ImageKit response:", ikError.response);

      try {
        uploadedFile = saveReportLocally(req, file, sanitizedName);
        console.warn("Falling back to local report storage:", uploadedFile.url);
      } catch (fallbackError) {
        console.error("Local report storage failed:", fallbackError);
        return res.status(500).json({
          success: false,
          message:
            "ImageKit upload failed and local fallback storage also failed",
          details: fallbackError?.message || ikError?.message || fallbackError,
        });
      }
    }

    if (!uploadedFile || !uploadedFile.url) {
      return res.status(500).json({
        success: false,
        message: "ImageKit upload failed",
      });
    }

    // Save report metadata to MongoDB
    const report = await ReportModel.create({
      patientId,
      fileName: file.originalname,
      fileUrl: uploadedFile.url,
      fileId: uploadedFile.fileId,
      filePath: uploadedFile.filePath,
      storageType: uploadedFile.storageType,
      localPath: uploadedFile.localPath,
      token: generateToken(),
    });

    console.log("Report Saved to DB:", report);

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

    return res.status(200).json({
      success: true,
      data: reports,
    });
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

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Invalid token",
      });
    }

    return res.status(200).json({
      success: true,
      data: report,
    });
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

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    const safeNewName = normalizeFileName(newFileName, report.fileName);

    if (!safeNewName) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid file name",
      });
    }

    const storageType = getReportStorageType(report);

    if (storageType === "local") {
      const currentLocalName = report.localPath
        ? path.basename(report.localPath)
        : path.basename(report.fileUrl);
      const currentLocalPath =
        report.localPath || path.join(reportUploadDir, currentLocalName);
      const nextLocalPath = path.join(reportUploadDir, safeNewName);

      if (!fs.existsSync(currentLocalPath)) {
        return res.status(404).json({
          success: false,
          message: "Local report file not found on server",
        });
      }

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

    if (!report.filePath) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot rename this report because its ImageKit file path is missing",
      });
    }

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

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

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

    return res.status(200).json({
      success: true,
      message: "Report deleted successfully",
    });
  } catch (err) {
    console.error("DELETE REPORT ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Server error deleting report",
    });
  }
}

module.exports = {
  uploadReport,
  getMyReports,
  getReportByToken,
  renameReport,
  deleteReport,
};
