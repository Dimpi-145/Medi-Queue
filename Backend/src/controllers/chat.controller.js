const ChatMessage = require("../models/chatMessage.model");
const Appointment = require("../models/appointment.model");
const User = require("../models/user.model");

// ================= SEND MESSAGE =================
async function sendMessage(req, res) {
  try {
    const { appointmentId, message } = req.body;
    const senderId = req.user.id;
    const senderRole = req.user.role;
    const io = req.app.get("io");

    if (!appointmentId || !message || !message.trim()) {
      return res.status(400).json({
        message: "appointmentId and message are required",
      });
    }

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const isDoctor =
      senderRole === "doctor" && appointment.doctorId.toString() === senderId;
    const isPatient =
      senderRole === "patient" && appointment.patientId.toString() === senderId;

    if (!isDoctor && !isPatient) {
      return res.status(403).json({ message: "Not authorized to message in this appointment" });
    }

    if (appointment.status !== "completed") {
      return res.status(400).json({
        message: "Chat is only available after consultation completion",
      });
    }

    const receiverId = isDoctor ? appointment.patientId : appointment.doctorId;

    const senderUser = await User.findById(senderId).select("username role");
    const receiverUser = await User.findById(receiverId).select("username role");

    const chatMessage = await ChatMessage.create({
      appointmentId,
      consultationId: appointmentId,
      senderId,
      receiverId,
      senderRole,
      message: message.trim(),
    });

    const payload = {
      _id: chatMessage._id,
      appointmentId: chatMessage.appointmentId,
      consultationId: chatMessage.consultationId,
      senderId: chatMessage.senderId,
      senderName: senderUser?.username || senderRole,
      receiverId: chatMessage.receiverId,
      receiverName: receiverUser?.username || "",
      senderRole: chatMessage.senderRole,
      message: chatMessage.message,
      createdAt: chatMessage.createdAt,
    };

    // Emit to consultation room
    const roomId = `consultation-${appointmentId}`;
    io.to(roomId).emit("newMessage", payload);
    
    // Also emit directly to sender and receiver user rooms for reliability
    io.to(senderId.toString()).emit("newMessage", payload);
    io.to(receiverId.toString()).emit("newMessage", payload);

    return res.status(201).json({
      message: "Message sent",
      chatMessage: payload,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

// ================= GET CHAT HISTORY =================
async function getChatHistory(req, res) {
  try {
    const { consultationId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const appointment = await Appointment.findById(consultationId);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const isDoctor =
      userRole === "doctor" && appointment.doctorId.toString() === userId;
    const isPatient =
      userRole === "patient" && appointment.patientId.toString() === userId;

    if (!isDoctor && !isPatient) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (appointment.status !== "completed") {
      return res.status(400).json({
        message: "Chat history is only available for completed consultations",
      });
    }

    const messages = await ChatMessage.find({ consultationId })
      .populate("senderId", "username role")
      .populate("receiverId", "username role")
      .sort({ createdAt: 1 });

    const formattedMessages = messages.map((msg) => ({
      _id: msg._id,
      appointmentId: msg.appointmentId,
      consultationId: msg.consultationId,
      senderId: msg.senderId?._id,
      senderName: msg.senderId?.username || msg.senderName || msg.senderRole,
      receiverId: msg.receiverId?._id,
      receiverName: msg.receiverId?.username || msg.receiverName || "",
      senderRole: msg.senderRole,
      message: msg.message,
      attachment: msg.attachment,
      createdAt: msg.createdAt,
    }));

    return res.status(200).json({
      consultationId,
      messages: formattedMessages,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

// ================= GET FOLLOW-UP CONSULTATIONS =================
async function getFollowUpConsultations(req, res) {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = { status: "completed" };

    if (userRole === "patient") {
      query.patientId = userId;
    } else if (userRole === "doctor") {
      query.doctorId = userId;
    } else {
      return res.status(403).json({ message: "Not authorized" });
    }

    const consultations = await Appointment.find(query)
      .populate("patientId", "username email profileImage age gender phone")
      .populate("doctorId", "username email specialization profileImage")
      .sort({ createdAt: -1 });

    // For each consultation, get message count
    const consultationsWithMessageCount = await Promise.all(
      consultations.map(async (consultation) => {
        const messageCount = await ChatMessage.countDocuments({
          appointmentId: consultation._id,
        });
        return {
          ...consultation.toObject(),
          messageCount,
        };
      })
    );

    return res.status(200).json({
      consultations: consultationsWithMessageCount,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

// ================= SEND MESSAGE WITH FILE =================
async function sendMessageWithFile(req, res) {
  try {
    const { appointmentId, message = "" } = req.body;
    const senderId = req.user.id;
    const senderRole = req.user.role;
    const io = req.app.get("io");

    console.log("[sendMessageWithFile] Received upload:", {
      appointmentId,
      messageLength: message?.length || 0,
      file: req.file ? { name: req.file.filename, size: req.file.size, mimetype: req.file.mimetype } : null,
      senderId,
      senderRole,
    });

    if (!appointmentId) {
      return res.status(400).json({
        message: "appointmentId is required",
      });
    }

    if (!req.file && !message.trim()) {
      return res.status(400).json({
        message: "Either a file or message is required",
      });
    }

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const isDoctor =
      senderRole === "doctor" && appointment.doctorId.toString() === senderId;
    const isPatient =
      senderRole === "patient" && appointment.patientId.toString() === senderId;

    if (!isDoctor && !isPatient) {
      return res.status(403).json({ message: "Not authorized to message in this appointment" });
    }

    if (appointment.status !== "completed") {
      return res.status(400).json({
        message: "Chat is only available after consultation completion",
      });
    }

    const receiverId = isDoctor ? appointment.patientId : appointment.doctorId;

    const senderUser = await User.findById(senderId).select("username role");
    const receiverUser = await User.findById(receiverId).select("username role");

    // Build attachment object if file was uploaded
    let attachment = null;
    if (req.file) {
      const fileUrl = `/uploads/chat/${req.file.filename}`;
      attachment = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        url: fileUrl,
        mimetype: req.file.mimetype,
        size: req.file.size,
      };
      console.log("[sendMessageWithFile] Attachment created:", attachment);
    }

    const chatMessage = await ChatMessage.create({
      appointmentId,
      consultationId: appointmentId,
      senderId,
      receiverId,
      senderRole,
      message: message.trim(),
      attachment,
    });

    const payload = {
      _id: chatMessage._id,
      appointmentId: chatMessage.appointmentId,
      consultationId: chatMessage.consultationId,
      senderId: chatMessage.senderId,
      senderName: senderUser?.username || senderRole,
      receiverId: chatMessage.receiverId,
      receiverName: receiverUser?.username || "",
      senderRole: chatMessage.senderRole,
      message: chatMessage.message,
      attachment: chatMessage.attachment,
      createdAt: chatMessage.createdAt,
    };

    console.log("[sendMessageWithFile] Broadcasting message:", payload);

    // Emit to consultation room
    const roomId = `consultation-${appointmentId}`;
    io.to(roomId).emit("newMessage", payload);
    
    // Also emit directly to sender and receiver user rooms for reliability
    io.to(senderId.toString()).emit("newMessage", payload);
    io.to(receiverId.toString()).emit("newMessage", payload);

    return res.status(201).json({
      message: "Message sent with file",
      chatMessage: payload,
    });
  } catch (error) {
    console.error("[sendMessageWithFile] Error:", error);
    return res.status(500).json({ message: error.message });
  }
}

module.exports = {
  sendMessage,
  sendMessageWithFile,
  getChatHistory,
  getFollowUpConsultations,
};
