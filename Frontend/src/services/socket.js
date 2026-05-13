import { io } from "socket.io-client";

let socket = null;
const joinedConsultationRooms = new Set();
const joinedUserRooms = new Set();

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

const toConsultationRoom = (appointmentIdOrRoomId) => {
  const value = String(appointmentIdOrRoomId || "");
  if (!value) return "";
  return value.startsWith("consultation-")
    ? value
    : `consultation-${value}`;
};

const rejoinRooms = () => {
  if (!socket?.connected) {
    console.log("[socket-debug] rejoin skipped; socket not connected");
    return;
  }

  console.log("[socket-debug] rejoining rooms", {
    socketId: socket.id,
    userRooms: Array.from(joinedUserRooms),
    consultationRooms: Array.from(joinedConsultationRooms),
  });

  joinedUserRooms.forEach((userId) => {
    console.log("[socket-debug] emit joinUserRoom", {
      socketId: socket.id,
      userId,
    });
    socket.emit("joinUserRoom", userId);
  });

  joinedConsultationRooms.forEach((roomId) => {
    console.log("[socket-debug] emit joinConsultationRoom", {
      socketId: socket.id,
      roomId,
    });
    socket.emit("joinConsultationRoom", roomId);
  });
};

export const initSocket = (token) => {
  try {
    console.log("[socket-debug] initSocket", {
      hasToken: Boolean(token),
      existingSocket: Boolean(socket),
      connected: Boolean(socket?.connected),
    });

    // Reuse the singleton socket. Do not recreate it while a page is
    // waiting on reconnect, otherwise page-level listeners become stale.
    if (socket) {
      if (token) {
        socket.auth = {
          ...(socket.auth || {}),
          token,
        };
      }

      if (!socket.connected) {
        socket.connect();
      } else {
        rejoinRooms();
      }

      return socket;
    }

    socket = io(BACKEND_URL, {
      transports: ["websocket"],
      autoConnect: false,

      auth: {
        token,
      },

      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,

      timeout: 20000,
      forceNew: false,
    });

    socket.on("connect", () => {
      console.log("[socket-debug] connected", {
        socketId: socket.id,
      });
      rejoinRooms();
    });

    socket.on("disconnect", (reason) => {
      console.log("[socket-debug] disconnected", {
        reason,
        socketId: socket.id,
      });
    });

    socket.on("connect_error", (err) => {
      console.error("[socket-debug] connect_error", {
        message: err.message,
        hasToken: Boolean(socket?.auth?.token),
      });
    });

    socket.on("reconnect_attempt", (attempt) => {
      console.log("[socket] reconnect_attempt:", attempt);
    });

    socket.on("reconnect", (attempt) => {
      console.log("[socket] reconnected after attempts:", attempt);
    });

    socket.on("reconnect_failed", () => {
      console.error("[socket] reconnect_failed");
    });

    socket.connect();

    return socket;
  } catch (error) {
    console.error("[socket] initialization error:", error);
    return null;
  }
};

export const getSocket = () => {
  return socket;
};

export const joinConsultationRoom = (appointmentId) => {
  const roomId = toConsultationRoom(appointmentId);
  if (!roomId) return;

  joinedConsultationRooms.add(roomId);
  console.log("[socket-debug] joinConsultationRoom requested", {
    appointmentId,
    roomId,
    hasSocket: Boolean(socket),
    connected: Boolean(socket?.connected),
    socketId: socket?.id,
  });

  if (!socket) return;

  socket.emit(
    "joinConsultationRoom",
    roomId
  );
};

export const leaveConsultationRoom = (appointmentId) => {
  const roomId = toConsultationRoom(appointmentId);
  if (!roomId) return;

  joinedConsultationRooms.delete(roomId);
  console.log("[socket-debug] leaveConsultationRoom requested", {
    appointmentId,
    roomId,
    hasSocket: Boolean(socket),
    connected: Boolean(socket?.connected),
    socketId: socket?.id,
  });

  if (!socket) return;

  socket.emit(
    "leaveConsultationRoom",
    roomId
  );
};

export const joinUserRoom = (userId) => {
  if (!userId) return;

  const roomId = String(userId);
  joinedUserRooms.add(roomId);
  console.log("[socket-debug] joinUserRoom requested", {
    userId: roomId,
    hasSocket: Boolean(socket),
    connected: Boolean(socket?.connected),
    socketId: socket?.id,
  });

  if (!socket) return;

  socket.emit("joinUserRoom", roomId);
};

export const leaveUserRoom = (userId) => {
  if (!userId) return;

  const roomId = String(userId);
  joinedUserRooms.delete(roomId);
  console.log("[socket-debug] leaveUserRoom requested", {
    userId: roomId,
    hasSocket: Boolean(socket),
    connected: Boolean(socket?.connected),
    socketId: socket?.id,
  });

  if (!socket) return;

  socket.emit("leaveUserRoom", roomId);
};

export const disconnectSocket = () => {
  try {
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
      joinedConsultationRooms.clear();
      joinedUserRooms.clear();
    }
  } catch (error) {
    console.error("[socket] disconnect error:", error);
  }
};
