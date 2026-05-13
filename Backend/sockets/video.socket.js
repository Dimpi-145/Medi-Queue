// video.socket.js
module.exports.register = function (io, socket) {
  socket.on("joinVideoRoom", (data) => {
    const { roomId, userId } = data || {};
    if (!roomId) return;
    socket.join(roomId);
    socket.to(roomId).emit("userJoinedVideo", { userId, socketId: socket.id });
  });

  socket.on("leaveVideoRoom", (roomId) => {
    if (!roomId) return;
    socket.leave(roomId);
  });

  socket.on("sendOffer", (data) => {
    const { roomId, offer, from } = data || {};
    if (!roomId || !offer) return;
    socket.to(roomId).emit("receiveOffer", { offer, from, socketId: socket.id });
  });

  socket.on("sendAnswer", (data) => {
    const { roomId, answer, from } = data || {};
    if (!roomId || !answer) return;
    socket.to(roomId).emit("receiveAnswer", { answer, from, socketId: socket.id });
  });

  socket.on("sendIceCandidate", (data) => {
    const { roomId, candidate, from } = data || {};
    if (!roomId || !candidate) return;
    socket.to(roomId).emit("receiveIceCandidate", { candidate, from });
  });

  socket.on("toggleMute", (data) => {
    const { roomId, isMuted } = data || {};
    if (!roomId) return;
    socket.to(roomId).emit("userMuteToggled", { isMuted, socketId: socket.id });
  });

  socket.on("toggleCamera", (data) => {
    const { roomId, cameraOn } = data || {};
    if (!roomId) return;
    socket.to(roomId).emit("userCameraToggled", { cameraOn, socketId: socket.id });
  });
};
