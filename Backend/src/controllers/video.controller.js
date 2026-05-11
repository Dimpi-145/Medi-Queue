const VideoRequest = require("../models/videoRequest.model");
const Appointment = require("../models/appointment.model");
const { v4: uuidv4 } = require("uuid");

// ================= REQUEST VIDEO CONSULTATION =================
async function requestVideoConsultation(req, res) {
  try {
    const { appointmentId } = req.body;
    const patientId = req.user.id;
    const io = req.app.get("io");

    if (!appointmentId) {
      return res.status(400).json({ message: "appointmentId is required" });
    }

    const appointment = await Appointment.findById(appointmentId)
      .populate("doctorId", "_id username email")
      .populate("patientId", "_id username email");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Only allow if patient owns this appointment and it's completed
    if (appointment.patientId._id.toString() !== patientId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (appointment.status !== "completed") {
      return res.status(400).json({
        message: "Video consultation can only be requested after consultation completion",
      });
    }

    // Check if request already exists and is pending
    const existingRequest = await VideoRequest.findOne({
      appointmentId,
      status: "pending",
    });

    if (existingRequest) {
      return res.status(400).json({
        message: "Video consultation request already pending",
      });
    }

    const videoRequest = await VideoRequest.create({
      appointmentId,
      doctorId: appointment.doctorId._id,
      patientId,
    });

    // Notify doctor via socket
    io.to(appointment.doctorId._id.toString()).emit("videoRequestReceived", {
      videoRequestId: videoRequest._id,
      appointmentId,
      patientName: appointment.patientId.username,
      message: `${appointment.patientId.username} requested a video consultation`,
    });

    return res.status(201).json({
      message: "Video consultation request sent",
      videoRequest,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

// ================= RESPOND TO VIDEO REQUEST =================
async function respondToVideoRequest(req, res) {
  try {
    const { videoRequestId, action } = req.body;
    const doctorId = req.user.id;
    const io = req.app.get("io");

    if (!videoRequestId || !action) {
      return res.status(400).json({ message: "videoRequestId and action are required" });
    }

    if (!["accept", "reject"].includes(action)) {
      return res.status(400).json({ message: "action must be accept or reject" });
    }

    const videoRequest = await VideoRequest.findById(videoRequestId)
      .populate("appointmentId")
      .populate("patientId", "_id username email");

    if (!videoRequest) {
      return res.status(404).json({ message: "Video request not found" });
    }

    // Only doctor can respond
    if (videoRequest.doctorId.toString() !== doctorId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (videoRequest.status !== "pending") {
      return res.status(400).json({
        message: "Video request is not pending",
      });
    }

    if (action === "accept") {
      // Generate unique room ID
      const roomId = `video-${videoRequest._id}`;
      videoRequest.status = "accepted";
      videoRequest.roomId = roomId;
      videoRequest.respondedAt = new Date();
      await videoRequest.save();

      // Notify patient via socket
      io.to(videoRequest.patientId._id.toString()).emit("videoRequestAccepted", {
        videoRequestId: videoRequest._id,
        roomId,
        message: "Doctor accepted your video consultation request",
      });

      // Join both doctor and patient to video room
      io.to(doctorId).emit("joinVideoRoom", { roomId });
      io.to(videoRequest.patientId._id.toString()).emit("joinVideoRoom", { roomId });

      return res.status(200).json({
        message: "Video consultation accepted",
        videoRequest,
      });
    } else {
      // Reject
      videoRequest.status = "rejected";
      videoRequest.respondedAt = new Date();
      await videoRequest.save();

      // Notify patient via socket
      io.to(videoRequest.patientId._id.toString()).emit("videoRequestRejected", {
        videoRequestId: videoRequest._id,
        message: "Doctor rejected your video consultation request",
      });

      return res.status(200).json({
        message: "Video consultation rejected",
        videoRequest,
      });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

// ================= GET VIDEO REQUESTS FOR DOCTOR =================
async function getVideoRequests(req, res) {
  try {
    const doctorId = req.user.id;
    const { status = "pending" } = req.query;

    const filter = { doctorId };
    if (status) {
      filter.status = status;
    }

    const videoRequests = await VideoRequest.find(filter)
      .populate("appointmentId")
      .populate("patientId", "username email profileImage")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      videoRequests,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

// ================= GET VIDEO REQUEST STATUS =================
async function getVideoRequestStatus(req, res) {
  try {
    const { appointmentId } = req.params;

    const videoRequest = await VideoRequest.findOne({
      appointmentId,
      status: { $in: ["pending", "accepted"] },
    });

    if (!videoRequest) {
      return res.status(404).json({ message: "No active video request" });
    }

    return res.status(200).json({
      videoRequest,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = {
  requestVideoConsultation,
  respondToVideoRequest,
  getVideoRequests,
  getVideoRequestStatus,
};
