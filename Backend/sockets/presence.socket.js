// presence.socket.js
module.exports.register = function (io, socket) {
  // client can ask for full presence map
  socket.on("getPresence", (cb) => {
    try {
      const map = Array.from(socket.activeUsers.entries()).map(([userId, info]) => ({ userId, ...info }));
      if (typeof cb === "function") cb(null, map);
    } catch (err) {
      if (typeof cb === "function") cb(err.message);
    }
  });
};
