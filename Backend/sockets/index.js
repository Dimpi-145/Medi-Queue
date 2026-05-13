const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const chatSocket = require("./chat.socket");
const videoSocket = require("./video.socket");
const presenceSocket = require("./presence.socket");

const activeUsers = new Map(); // userId -> { socketId, lastSeen }

function initSockets(server, app) {
  const io = new Server(server, {
    cors: {
      origin: [process.env.FRONTEND_URL || "http://localhost:5173"],
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingInterval: 20000,
    pingTimeout: 60000,
  });

  // attach io to express app for controllers
  app.set("io", io);

  // JWT auth for sockets
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || (socket.handshake.headers?.authorization || "").split(" ")[1];
      console.log("[socket-debug] auth attempt", {
        socketId: socket.id,
        hasAuthToken: Boolean(socket.handshake.auth?.token),
        hasAuthorizationHeader: Boolean(socket.handshake.headers?.authorization),
      });

      if (!token) {
        console.log("[socket-debug] auth rejected: no token", {
          socketId: socket.id,
        });

        return next(new Error("Unauthorized: no token"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // { id, role }
      console.log("[socket-debug] auth accepted", {
        socketId: socket.id,
        userId: decoded.id,
        role: decoded.role,
      });

      return next();
    } catch (err) {
      console.log("[socket-debug] auth rejected", {
        socketId: socket.id,
        message: err.message,
      });

      return next(new Error("Unauthorized"));
    }
  });

  // connection handler delegates to modular sockets
  io.on("connection", (socket) => {
    // presence tracking
    const userId = String(socket.user?.id || "");
    if (userId) {
      activeUsers.set(userId, { socketId: socket.id, lastSeen: Date.now() });
      io.emit("userOnline", { userId });
    }

    socket.on("disconnect", (reason) => {
      if (userId) {
        activeUsers.delete(userId);
        io.emit("userOffline", { userId, reason });
      }
    });

    // attach helpers
    socket.activeUsers = activeUsers;

    // delegate
    chatSocket.register(io, socket);
    videoSocket.register(io, socket);
    presenceSocket.register(io, socket);
  });

  return io;
}

module.exports = { initSockets };
