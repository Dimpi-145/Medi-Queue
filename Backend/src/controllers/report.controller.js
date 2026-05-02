const ReportModel = require("../models/report.model");
const generateToken = require("../utils/report.token");
const ImageKit = require("@imagekit/nodejs");
const { toFile } = require("@imagekit/nodejs");

const imagekit = new ImageKit({
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
})

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

    // Convert buffer to base64 string (simpler approach)
    const fileBase64 = file.buffer.toString("base64");

    // Upload to ImageKit
    let uploadedFile;
    try {
      uploadedFile = await imagekit.files.upload({
        file: fileBase64,
        fileName: `${Date.now()}-${file.originalname}`,
        folder: "/reports",
      });
      console.log("ImageKit Upload Response:", uploadedFile);
    } catch (ikError) {
      console.error("ImageKit Error Details:");
      console.error("Status:", ikError.status);
      console.error("Error Object:", ikError.error);
      console.error("Message:", ikError.message);
      console.error("Headers:", ikError.headers);
      console.error("Full Error:", ikError);
      throw ikError;
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
      fileUrl: uploadedFile.url,
      fileName: file.originalname,
      fileId: uploadedFile.fileId,
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

//   try {
//     const patientId = req.user.id;

//     if (!req.files || !req.files.report) {
//       return res.status(400).json({
//         success: false,
//         message: "No report file uploaded",
//       });
//     }

//     const file = req.files.report;

//     if (!file.mimetype.startsWith("image/")) {
//       return res.status(400).json({
//         success: false,
//         message: "Only image files are allowed",
//       });
//     }

//     const uploadedFile = await imagekit.upload({
//       file: file.data.toString("base64"),
//       fileName: `${Date.now()}-${file.name}`,
//       folder: "/reports",
//     });

//     if (!uploadedFile || !uploadedFile.url) {
//       return res.status(500).json({
//         success: false,
//         message: "ImageKit upload failed",
//       });
//     }

//     const report = await Report.create({
//       patientId,
//       fileUrl: uploadedFile.url,
//       token: generateToken(),
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Report uploaded successfully",
//       data: report,
//     });
//   } catch (err) {
//     console.error("REPORT UPLOAD ERROR:", err);
//     return res.status(500).json({
//       success: false,
//       message: err.message || "Server error during upload",
//     });
//   }
// }

// // ================= GET MY REPORTS =================
// async function getMyReports(req, res) {
//   try {
//     const patientId = req.user.id;

//     const reports = await Report.find({ patientId }).sort({ createdAt: -1 });

//     return res.json(reports);
//   } catch (err) {
//     return res.status(500).json({ message: err.message });
//   }
// }

// // ================= GET REPORT BY TOKEN =================
// async function getReportByToken(req, res) {
//   try {
//     const { token } = req.params;

//     const report = await Report.findOne({ token }).populate("patientId", "username");

//     if (!report) {
//       return res.status(404).json({ message: "Invalid token" });
//     }

//     res.json(report);

//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// }



module.exports = {
  uploadReport,
  // getMyReports,
  // getReportByToken,
};