const VideoRequest = require("../models/videoRequest.model");
const Appointment = require("../models/appointment.model");
const { v4: uuidv4 } = require("uuid");

// ================= REQUEST VIDEO CONSULTATION =================

async function requestVideoConsultation(req, res) {

  try {

    const { appointmentId } = req.body;

    const userId = req.user.id;

    const io = req.app.get("io");

    if (!appointmentId) {

      return res.status(400).json({
        message: "appointmentId is required",
      });
    }

    const appointment =
      await Appointment.findById(
        appointmentId
      )
        .populate(
          "doctorId",
          "_id username email"
        )
        .populate(
          "patientId",
          "_id username email"
        );

    if (!appointment) {

      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    // Determine initiator (must be either patient or doctor on the appointment)
    let initiator = null;

    if (appointment.patientId._id.toString() === userId) {
      initiator = "patient";
    } else if (appointment.doctorId._id.toString() === userId) {
      initiator = "doctor";
    } else {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Only after completion

    if (
      appointment.status !==
      "completed"
    ) {

      return res.status(400).json({
        message:
          "Video consultation can only be requested after consultation completion",
      });
    }

    // Existing pending request

    const existingRequest =
      await VideoRequest.findOne({
        appointmentId,
        status: "pending",
      });

    if (existingRequest) {

      return res.status(400).json({
        message:
          "Video consultation request already pending",
      });
    }

    // Create request


    const videoRequest = await VideoRequest.create({
      appointmentId,
      doctorId: appointment.doctorId._id,
      patientId: appointment.patientId._id,
      initiator,
    });

    // Notify the other party depending on initiator
    const payload = {
      videoRequestId: videoRequest._id,
      appointmentId,
      initiator,
      message:
        initiator === "patient"
          ? `${appointment.patientId.username} requested a video consultation`
          : `${appointment.doctorId.username || "Doctor"} initiated a video consultation`,
    };

    if (initiator === "patient") {
      io.to(appointment.doctorId._id.toString()).emit("videoRequestReceived", payload);
    } else {
      io.to(appointment.patientId._id.toString()).emit("videoRequestReceived", payload);
    }

    return res.status(201).json({
      message:
        "Video consultation request sent",

      videoRequest,
    });

  } catch (error) {

    return res.status(500).json({
      message: error.message,
    });
  }
}

// ================= RESPOND TO VIDEO REQUEST =================

async function respondToVideoRequest(
  req,
  res
) {

  try {

    const {
      videoRequestId,
      action,
    } = req.body;

    const userId = req.user.id;

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

    if (videoRequest.status !== "pending") {
      return res.status(400).json({ message: "Video request is not pending" });
    }

    // Only the non-initiator can respond
    if (videoRequest.initiator === "patient") {
      // patient initiated -> only doctor can respond
      if (userId !== videoRequest.doctorId.toString()) {
        return res.status(403).json({ message: "Not authorized to respond" });
      }
    } else {
      // doctor initiated -> only patient can respond
      if (userId !== videoRequest.patientId._id.toString()) {
        return res.status(403).json({ message: "Not authorized to respond" });
      }
    }

    if (action === "accept") {
      const roomId = `video-${videoRequest._id}`;

      videoRequest.status = "accepted";
      videoRequest.roomId = roomId;
      videoRequest.respondedAt = new Date();

      await videoRequest.save();

      const acceptedPayload = {
        videoRequestId: videoRequest._id,
        roomId,
        doctorId: videoRequest.doctorId,
        patientId: videoRequest.patientId._id,
        message: "Video consultation accepted",
      };

      // Notify both parties
      io.to(videoRequest.patientId._id.toString()).emit("videoRequestAccepted", acceptedPayload);
      io.to(videoRequest.doctorId.toString()).emit("videoRequestAccepted", acceptedPayload);

      return res.status(200).json({ message: "Video consultation accepted", videoRequest });
    } else {
      // reject
      videoRequest.status = "rejected";
      videoRequest.respondedAt = new Date();

      await videoRequest.save();

      const rejectedPayload = { videoRequestId: videoRequest._id, message: "Video consultation rejected" };

      io.to(videoRequest.patientId._id.toString()).emit("videoRequestRejected", rejectedPayload);
      io.to(videoRequest.doctorId.toString()).emit("videoRequestRejected", rejectedPayload);

      return res.status(200).json({ message: "Video consultation rejected", videoRequest });
    }

  } catch (error) {

    return res.status(500).json({
      message: error.message,
    });
  }
}

// ================= CANCEL VIDEO REQUEST =================

async function cancelVideoRequest(
  req,
  res
) {

  try {

    const appointmentId = req.body?.appointmentId || req.params?.appointmentId;

    const patientId = req.user.id;

    const io = req.app.get("io");

    if (!appointmentId) {

      return res.status(400).json({
        message:
          "appointmentId is required",
      });
    }

    const videoRequest = await VideoRequest.findOne({
      appointmentId,
      status: "pending",
    });

    if (!videoRequest) {

      return res.status(404).json({
        message:
          "No pending video request found",
      });
    }


    // Allow either party (patient or doctor) to cancel a pending request
    const requesterId = req.user.id;

    if (
      requesterId !== videoRequest.patientId.toString() &&
      requesterId !== videoRequest.doctorId.toString()
    ) {
      return res.status(403).json({ message: "Not authorized to cancel this request" });
    }

    // Update status
    videoRequest.status = "cancelled";
    videoRequest.respondedAt = new Date();
    await videoRequest.save();

    const payload = {
      videoRequestId: videoRequest._id,
      appointmentId,
      cancelledBy: requesterId,
      message: "Video consultation request cancelled",
    };

    // Notify both parties so UIs can update
    io.to(videoRequest.doctorId.toString()).emit("videoRequestCancelled", payload);
    io.to(videoRequest.patientId.toString()).emit("videoRequestCancelled", payload);

    return res.status(200).json({
      message:
        "Video consultation request cancelled",

      videoRequest,
    });

  } catch (error) {

    return res.status(500).json({
      message: error.message,
    });
  }
}

// ================= GET VIDEO REQUESTS =================

async function getVideoRequests(
  req,
  res
) {

  try {

    const doctorId = req.user.id;

    const {
      status = "pending",
    } = req.query;

    const filter = {
      doctorId,
    };

    if (status) {

      filter.status = status;
    }

    const videoRequests =
      await VideoRequest.find(filter)
        .populate("appointmentId")
        .populate(
          "patientId",
          "username email profileImage"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      videoRequests,
    });

  } catch (error) {

    return res.status(500).json({
      message: error.message,
    });
  }
}

// ================= GET VIDEO REQUEST STATUS =================

async function getVideoRequestStatus(
  req,
  res
) {

  try {

    const { appointmentId } =
      req.params;

    const videoRequest =
      await VideoRequest.findOne({
        appointmentId,

        status: {
          $in: [
            "pending",
            "accepted",
          ],
        },
      });

    if (!videoRequest) {

      return res.status(404).json({
        message:
          "No active video request",
      });
    }

    return res.status(200).json({
      videoRequest,
    });

  } catch (error) {

    return res.status(500).json({
      message: error.message,
    });
  }
}

// ================= END ACTIVE VIDEO CALL =================

async function endVideoCall(req, res) {
  try {
    const { videoRequestId } = req.body;

    const userId = req.user.id;

    const io = req.app.get("io");

    if (!videoRequestId) {
      return res.status(400).json({ message: "videoRequestId is required" });
    }

    const videoRequest = await VideoRequest.findById(videoRequestId);

    if (!videoRequest) {
      return res.status(404).json({ message: "Video request not found" });
    }

    // Only participants can end the call
    if (userId !== videoRequest.patientId.toString() && userId !== videoRequest.doctorId.toString()) {
      return res.status(403).json({ message: "Not authorized to end this call" });
    }

    // Mark as completed (ended)
    videoRequest.status = "completed";
    videoRequest.respondedAt = new Date();
    await videoRequest.save();

    const payload = {
      videoRequestId: videoRequest._id,
      roomId: videoRequest.roomId,
      message: "Video call ended",
    };

    // Notify both parties
    io.to(videoRequest.doctorId.toString()).emit("videoCallEnded", payload);
    io.to(videoRequest.patientId.toString()).emit("videoCallEnded", payload);

    return res.status(200).json({ message: "Video call ended", videoRequest });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = {
  requestVideoConsultation,
  respondToVideoRequest,
  cancelVideoRequest,
  getVideoRequests,
  getVideoRequestStatus,
  endVideoCall,
};