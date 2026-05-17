module.exports.register = function (
  io,
  socket
) {
  console.log(
    "[socket] connected:",
    socket.id
  );

  // ================= JOIN ROOM =================

  socket.on(
    "joinConsultationRoom",
    (roomId) => {
      try {
        if (!roomId) return;

        console.log(
          "[socket-debug] joinConsultationRoom received",
          {
            socketId: socket.id,
            userId: socket.user?.id,
            roomId,
            roomsBefore:
              Array.from(socket.rooms),
          }
        );

        socket.join(roomId);

        console.log(
          "[socket-debug] joinConsultationRoom completed",
          {
            socketId: socket.id,
            userId: socket.user?.id,
            roomId,
            roomsAfter:
              Array.from(socket.rooms),
          }
        );

        socket.emit(
          "roomJoined",
          {
            roomId,
          }
        );
      } catch (error) {
        console.error(
          "[socket] join room error:",
          error
        );
      }
    }
  );

  // ================= JOIN USER ROOM =================

  socket.on(
    "joinUserRoom",
    (userId) => {
      try {
        const authenticatedUserId =
          String(
            socket.user?.id ||
              ""
          );

        console.log(
          "[socket-debug] joinUserRoom received",
          {
            socketId: socket.id,
            requestedUserId:
              String(userId || ""),
            authenticatedUserId,
            roomsBefore:
              Array.from(socket.rooms),
          }
        );

        if (
          !userId ||
          String(userId) !==
            authenticatedUserId
        ) {
          console.log(
            "[socket-debug] joinUserRoom rejected",
            {
              socketId: socket.id,
              requestedUserId:
                String(userId || ""),
              authenticatedUserId,
            }
          );

          return;
        }

        socket.join(
          authenticatedUserId
        );

        console.log(
          "[socket-debug] joinUserRoom completed",
          {
            socketId: socket.id,
            userRoom:
              authenticatedUserId,
            roomsAfter:
              Array.from(socket.rooms),
          }
        );
      } catch (error) {
        console.error(
          "[socket] join user room error:",
          error
        );
      }
    }
  );

  // ================= JOIN DOCTOR ROOM =================

  socket.on(
    "joinDoctorRoom",
    (doctorId) => {
      try {
        if (!doctorId) return;
        const targetRoom = String(doctorId);
        socket.join(targetRoom);
        console.log(
          `[socket-debug] socket ${socket.id} joined doctor room ${targetRoom}`
        );
      } catch (error) {
        console.error(
          "[socket] join doctor room error:",
          error
        );
      }
    }
  );

  // ================= LEAVE DOCTOR ROOM =================

  socket.on(
    "leaveDoctorRoom",
    (doctorId) => {
      try {
        if (!doctorId) return;
        const targetRoom = String(doctorId);
        socket.leave(targetRoom);
        console.log(
          `[socket-debug] socket ${socket.id} left doctor room ${targetRoom}`
        );
      } catch (error) {
        console.error(
          "[socket] leave doctor room error:",
          error
        );
      }
    }
  );

  // ================= LEAVE USER ROOM =================

  socket.on(
    "leaveUserRoom",
    (userId) => {
      try {
        const authenticatedUserId =
          String(
            socket.user?.id ||
              ""
          );

        console.log(
          "[socket-debug] leaveUserRoom received",
          {
            socketId: socket.id,
            requestedUserId:
              String(userId || ""),
            authenticatedUserId,
          }
        );

        if (
          !userId ||
          String(userId) !==
            authenticatedUserId
        ) {
          return;
        }

        socket.leave(
          authenticatedUserId
        );

        console.log(
          "[socket-debug] leaveUserRoom completed",
          {
            socketId: socket.id,
            userRoom:
              authenticatedUserId,
            roomsAfter:
              Array.from(socket.rooms),
          }
        );
      } catch (error) {
        console.error(
          "[socket] leave user room error:",
          error
        );
      }
    }
  );

  // ================= LEAVE ROOM =================

  socket.on(
    "leaveConsultationRoom",
    (roomId) => {
      try {
        if (!roomId) return;

        console.log(
          "[socket-debug] leaveConsultationRoom received",
          {
            socketId: socket.id,
            userId: socket.user?.id,
            roomId,
            roomsBefore:
              Array.from(socket.rooms),
          }
        );

        socket.leave(roomId);

        console.log(
          "[socket-debug] leaveConsultationRoom completed",
          {
            socketId: socket.id,
            roomId,
            roomsAfter:
              Array.from(socket.rooms),
          }
        );
      } catch (error) {
        console.error(
          "[socket] leave room error:",
          error
        );
      }
    }
  );

  // ================= SEND MESSAGE =================

  socket.on(
    "sendMessage",
    (payload, ack) => {
      try {
        const {
          roomId,
          message,
        } = payload || {};

        if (
          !roomId ||
          !message
        ) {
          return (
            ack &&
            ack({
              error:
                "invalid payload",
            })
          );
        }

        console.log(
          `[socket] broadcasting to ${roomId}`
        );

        io.to(roomId).emit(
          "newMessage",
          message
        );

        ack &&
          ack({
            ok: true,
          });
      } catch (err) {
        console.error(
          "[socket] sendMessage error:",
          err
        );

        ack &&
          ack({
            error:
              err.message,
          });
      }
    }
  );

  // ================= DISCONNECT =================

  socket.on(
    "disconnect",
    (reason) => {
      console.log(
        `[socket] disconnected ${socket.id} reason=${reason}`
      );
    }
  );
};
