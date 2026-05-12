require("dotenv").config();
const app = require("./src/app");
const connectToDatabase = require("./src/config/database");
const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// make io available globally
app.set("io", io);

// Setup socket.io connection handlers
function setupSocketHandlers(io) {
  io.on("connection", (socket) => {
    console.log(" Client connected:", socket.id);

    // ================= JOIN USER ROOM =================
    // Each user joins a room with their ID for direct messaging
    socket.on("joinUserRoom", (userId) => {
      socket.join(userId);
      console.log(`Socket ${socket.id} joined user room ${userId}`);
    });

    // ================= LEAVE USER ROOM =================
    socket.on("leaveUserRoom", (userId) => {
      socket.leave(userId);
      console.log(`Socket ${socket.id} left user room ${userId}`);
    });

    // ================= JOIN DOCTOR ROOM (for notifications) =================
    socket.on("joinDoctorRoom", (doctorId) => {
      socket.join(doctorId);
      console.log(`Socket ${socket.id} joined doctor room ${doctorId}`);
    });

    // ================= LEAVE DOCTOR ROOM =================
    socket.on("leaveDoctorRoom", (doctorId) => {
      socket.leave(doctorId);
      console.log(`Socket ${socket.id} left doctor room ${doctorId}`);
    });

    // ================= JOIN CONSULTATION ROOM =================
    socket.on("joinConsultationRoom", (roomId) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined consultation room ${roomId}`);
    });

    // ================= LEAVE CONSULTATION ROOM =================
    socket.on("leaveConsultationRoom", (roomId) => {
      socket.leave(roomId);
      console.log(`Socket ${socket.id} left consultation room ${roomId}`);
    });

    // ================= JOIN VIDEO ROOM =================
    socket.on("joinVideoRoom", (data) => {
      const { roomId, userId } = data;
      socket.join(roomId);
      socket
        .to(roomId)
        .emit("userJoinedVideo", { userId, socketId: socket.id });
      console.log(`Socket ${socket.id} joined video room ${roomId}`);
    });

    // ================= LEAVE VIDEO ROOM =================
    socket.on("leaveVideoRoom", (roomId) => {
      socket.leave(roomId);
      console.log(`Socket ${socket.id} left video room ${roomId}`);
    });

    // ================= WebRTC SIGNALING - SEND OFFER =================
    socket.on("sendOffer", (data) => {
      const { roomId, offer, from } = data;
      socket
        .to(roomId)
        .emit("receiveOffer", { offer, from, socketId: socket.id });
    });

    // ================= WebRTC SIGNALING - SEND ANSWER =================
    socket.on("sendAnswer", (data) => {
      const { roomId, answer, from } = data;
      socket
        .to(roomId)
        .emit("receiveAnswer", { answer, from, socketId: socket.id });
    });

    // ================= WebRTC SIGNALING - SEND ICE CANDIDATE =================
    socket.on("sendIceCandidate", (data) => {
      const { roomId, candidate, from } = data;
      socket.to(roomId).emit("receiveIceCandidate", { candidate, from });
    });

    // ================= VIDEO CALL CONTROL - MUTE/UNMUTE =================
    socket.on("toggleMute", (data) => {
      const { roomId, isMuted } = data;
      socket
        .to(roomId)
        .emit("userMuteToggled", { isMuted, socketId: socket.id });
    });

    // ================= VIDEO CALL CONTROL - CAMERA ON/OFF =================
    socket.on("toggleCamera", (data) => {
      const { roomId, cameraOn } = data;
      socket
        .to(roomId)
        .emit("userCameraToggled", { cameraOn, socketId: socket.id });
    });

    // ================= DISCONNECT =================
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
}

// Start server after database connection
(async () => {
  try {
    await connectToDatabase();
    console.log("✅ MongoDB connected successfully");

    // Setup socket handlers after DB connection
    setupSocketHandlers(io);

    server.listen(3000, () => {
      console.log("🚀 Server running on port 3000");
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
})();
