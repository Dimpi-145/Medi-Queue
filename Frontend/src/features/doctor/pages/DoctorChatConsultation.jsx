import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";

import {
  useParams,
  useNavigate,
} from "react-router-dom";

import {
  getChatHistory,
  sendChatMessage,
  sendChatMessageWithFile,
} from "../services/chat.api";

import {
  getVideoRequestStatus,
  respondToVideoRequest,
  requestVideoConsultation,
  cancelVideoConsultation,
} from "../services/video.api";

import {
  initSocket,
  getSocket,
  joinConsultationRoom,
  leaveConsultationRoom,
  joinUserRoom,
  leaveUserRoom,
} from "../../../services/socket";

import "../styles/ChatConsultation.scss";

const DoctorChatConsultation = () => {
  const { appointmentId } =
    useParams();

  const navigate = useNavigate();

  const [messages, setMessages] =
    useState([]);

  const [input, setInput] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [sending, setSending] =
    useState(false);

  const [videoRequest, setVideoRequest] =
    useState(null);

  const [videoStatus, setVideoStatus] =
    useState(null);

  const [videoMessage, setVideoMessage] =
    useState("");

  const [onlineStatus, setOnlineStatus] =
    useState("offline");

  const [
    respondingVideo,
    setRespondingVideo,
  ] = useState(false);

  const [selectedFile, setSelectedFile] =
    useState(null);

  const [filePreview, setFilePreview] =
    useState(null);

  const [uploading, setUploading] =
    useState(false);

  const messagesEndRef =
    useRef(null);

  const fileInputRef =
    useRef(null);

  const token =
    localStorage.getItem("token");

  const userId =
    localStorage.getItem("userId");

  // ================= SCROLL =================

  const scrollToBottom =
    useCallback(() => {
      messagesEndRef.current?.scrollIntoView(
        {
          behavior: "smooth",
        }
      );
    }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // ================= LOAD CHAT =================

  useEffect(() => {
    if (!appointmentId) return;

    const loadChatHistory =
      async () => {
        try {
          setLoading(true);

          const res =
            await getChatHistory(
              appointmentId
            );

          setMessages(
            res.data.messages || []
          );
        } catch (error) {
          console.error(
            "[DoctorChat] failed loading chat:",
            error
          );
        } finally {
          setLoading(false);
        }
      };

    loadChatHistory();
  }, [appointmentId]);

  // ================= LOAD VIDEO STATUS =================

  useEffect(() => {
    if (!appointmentId) return;

    const loadVideoStatus =
      async () => {
        try {
          const res =
            await getVideoRequestStatus(
              appointmentId
            );

          const request =
            res.data.videoRequest;

          setVideoRequest(request);

          setVideoStatus(
            request?.status || null
          );
        } catch (error) {
          setVideoRequest(null);
          setVideoStatus(null);
        }
      };

    loadVideoStatus();
  }, [appointmentId]);

  // ================= SOCKET CONNECTION =================

  useEffect(() => {
    if (!appointmentId || !token)
      return;

    const socket =
      getSocket() ||
      initSocket(token);

    if (!socket) return;
    const roomId = `consultation-${appointmentId}`;

    console.log("[DoctorChat][socket-debug] effect start", {
      appointmentId,
      roomId,
      userId,
      hasToken: Boolean(token),
      hasSocket: Boolean(socket),
      connected: Boolean(socket?.connected),
      socketId: socket?.id,
    });

    const joinRooms = () => {
      console.log("[DoctorChat][socket-debug] joinRooms", {
        appointmentId,
        roomId,
        userId,
        connected: Boolean(socket?.connected),
        socketId: socket?.id,
      });

      joinUserRoom(userId);

      joinConsultationRoom(
        appointmentId
      );
    };

    const handleConnect =
      () => {
        console.log("[DoctorChat][socket-debug] connect handler", {
          appointmentId,
          roomId,
          socketId: socket.id,
        });

        joinRooms();

        setOnlineStatus(
          "online"
        );
      };

    // ===== NEW MESSAGE =====

    const handleNewMessage = (
      newMessage
    ) => {
      const incomingAppointmentId =
        String(
          newMessage.appointmentId ||
            ""
        );
      const currentAppointmentId =
        String(appointmentId);

      console.log("[DoctorChat][socket-debug] newMessage received", {
        currentAppointmentId,
        msgAppointmentId:
          incomingAppointmentId,
        messageId:
          String(
            newMessage._id || ""
          ),
        senderId:
          String(
            newMessage.senderId || ""
          ),
      });

      if (
        incomingAppointmentId !==
        currentAppointmentId
      ) {
        console.log("[DoctorChat][socket-debug] newMessage rejected by appointment filter", {
          currentAppointmentId,
          msgAppointmentId:
            incomingAppointmentId,
        });

        return;
      }

      setMessages((prev) => {
        // Exact duplicate prevention
        const alreadyExists =
          prev.some(
            (msg) =>
              String(msg._id) ===
              String(newMessage._id)
          );

        if (alreadyExists) {
          console.log("[DoctorChat][socket-debug] newMessage ignored as duplicate", {
            messageId:
              String(
                newMessage._id || ""
              ),
          });

          return prev;
        }

        // Replace optimistic message
        const optimisticIndex =
          prev.findIndex(
            (msg) =>
              String(
                msg._id
              ).startsWith(
                "local-"
              ) &&
              String(
                msg.senderId
              ) ===
                String(
                  newMessage.senderId
                ) &&
              msg.message ===
                newMessage.message
          );

        if (
          optimisticIndex !== -1
        ) {
          console.log("[DoctorChat][socket-debug] replacing optimistic message", {
            localIndex:
              optimisticIndex,
            messageId:
              String(
                newMessage._id || ""
              ),
          });

          const updated = [
            ...prev,
          ];

          updated[
            optimisticIndex
          ] = newMessage;

          return updated;
        }

        console.log("[DoctorChat][socket-debug] appending newMessage", {
          messageId:
            String(
              newMessage._id || ""
            ),
        });

        return [
          ...prev,
          newMessage,
        ];
      });
    };

    // ===== VIDEO REQUEST RECEIVED =====

    const handleVideoRequestReceived =
      (payload) => {
        if (
          String(
            payload.appointmentId
          ) !==
          String(appointmentId)
        ) {
          return;
        }

        setVideoRequest({
          _id:
            payload.videoRequestId,
          appointmentId:
            payload.appointmentId,
          status: "pending",
          patientName:
            payload.patientName,
        });

        setVideoStatus("pending");
      };

    // ===== VIDEO CANCELLED =====

    const handleVideoCancelled =
      (payload) => {
        if (
          String(
            payload.appointmentId
          ) ===
          String(appointmentId)
        ) {
          setVideoStatus(null);
          setVideoRequest(null);
        }
      };

    // ===== VIDEO ACCEPTED =====

    const handleVideoAccepted =
      (payload) => {
        if (payload?.roomId) {
          navigate(
            `/video-room/${payload.roomId}`
          );
        }
      };

    // ===== VIDEO REJECTED =====

    const handleVideoRejected =
      () => {
        setVideoStatus(
          "rejected"
        );

        setVideoRequest(null);
      };

    // ===== VIDEO ENDED =====

    const handleVideoEnded =
      () => {
        setVideoStatus(null);

        setVideoRequest(null);
      };

    // ===== DISCONNECT =====

    const handleDisconnect =
      () => {
        setOnlineStatus(
          "offline"
        );
      };

    console.log("[DoctorChat][socket-debug] registering listeners", {
      appointmentId,
      roomId,
      socketId: socket?.id,
      connected: Boolean(socket?.connected),
    });

    socket.on(
      "connect",
      handleConnect
    );

    socket.on(
      "newMessage",
      handleNewMessage
    );

    socket.on(
      "videoRequestReceived",
      handleVideoRequestReceived
    );

    socket.on(
      "videoRequestCancelled",
      handleVideoCancelled
    );

    socket.on(
      "videoRequestAccepted",
      handleVideoAccepted
    );

    socket.on(
      "videoRequestRejected",
      handleVideoRejected
    );

    socket.on(
      "videoCallEnded",
      handleVideoEnded
    );

    socket.on(
      "disconnect",
      handleDisconnect
    );

    // Join now as well as on future reconnects. Reused sockets may already
    // be connected before this component mounts.
    joinRooms();

    if (socket.connected) {
      setOnlineStatus(
        "online"
      );
    }

    return () => {
      console.log("[DoctorChat][socket-debug] cleanup listeners", {
        appointmentId,
        roomId,
        userId,
        socketId: socket?.id,
      });

      socket.off(
        "connect",
        handleConnect
      );

      socket.off(
        "newMessage",
        handleNewMessage
      );

      socket.off(
        "videoRequestReceived",
        handleVideoRequestReceived
      );

      socket.off(
        "videoRequestCancelled",
        handleVideoCancelled
      );

      socket.off(
        "videoRequestAccepted",
        handleVideoAccepted
      );

      socket.off(
        "videoRequestRejected",
        handleVideoRejected
      );

      socket.off(
        "videoCallEnded",
        handleVideoEnded
      );

      socket.off(
        "disconnect",
        handleDisconnect
      );

      leaveUserRoom(userId);

      leaveConsultationRoom(
        appointmentId
      );
    };
  }, [
    appointmentId,
    token,
    userId,
    navigate,
  ]);

  // ================= FILE SELECT =================

  const handleFileSelect = (
    e
  ) => {
    const file =
      e.target.files?.[0];

    if (!file) return;

    if (
      file.size >
      10 * 1024 * 1024
    ) {
      alert(
        "File size must be less than 10MB"
      );

      return;
    }

    setSelectedFile(file);

    if (
      file.type.startsWith(
        "image/"
      )
    ) {
      const reader =
        new FileReader();

      reader.onload = (
        event
      ) => {
        setFilePreview(
          event.target.result
        );
      };

      reader.readAsDataURL(
        file
      );
    } else {
      setFilePreview(null);
    }
  };

  // ================= SEND MESSAGE =================

  const handleSendMessage =
    async () => {
      if (
        !input.trim() &&
        !selectedFile
      ) {
        return;
      }

      const text =
        input.trim();

      setInput("");

      setSending(true);
      setUploading(true);

      const tempId = `local-${Date.now()}`;

      const optimisticMessage =
        {
          _id: tempId,
          appointmentId,
          senderId: userId,
          senderName:
            localStorage.getItem(
              "username"
            ) || "Doctor",
          senderRole:
            localStorage.getItem(
              "role"
            ) || "doctor",
          message: text,
          createdAt:
            new Date().toISOString(),
        };

      if (selectedFile) {
        optimisticMessage.attachment =
          {
            originalName:
              selectedFile.name,
            size:
              selectedFile.size,
            mimetype:
              selectedFile.type,
            url:
              filePreview ||
              null,
          };
      }

      setMessages((prev) => [
        ...prev,
        optimisticMessage,
      ]);

      try {
        if (selectedFile) {
          const formData =
            new FormData();

          formData.append(
            "appointmentId",
            appointmentId
          );

          formData.append(
            "message",
            text
          );

          formData.append(
            "file",
            selectedFile
          );

          await sendChatMessageWithFile(
            formData
          );

          setSelectedFile(null);

          setFilePreview(null);
        } else {
          await sendChatMessage(
            appointmentId,
            text
          );
        }
      } catch (error) {
        console.error(
          "[DoctorChat] send failed:",
          error
        );

        setMessages((prev) =>
          prev.filter(
            (msg) =>
              msg._id !== tempId
          )
        );

        setInput(text);

        const serverMessage =
          error?.response?.data
            ?.message;

        alert(
          `Failed to send message: ${
            serverMessage ||
            error.message
          }`
        );
      } finally {
        setSending(false);
        setUploading(false);
      }
    };

  // ================= VIDEO RESPONSE =================

  const handleVideoResponse =
    async (action) => {
      if (
        !videoRequest?._id
      )
        return;

      setRespondingVideo(
        true
      );

      try {
        const res =
          await respondToVideoRequest(
            videoRequest._id,
            action
          );

        const updatedRequest =
          res.data.videoRequest;

        setVideoRequest(
          updatedRequest
        );

        setVideoStatus(
          updatedRequest?.status ||
            null
        );

        if (
          action ===
            "accept" &&
          updatedRequest?.roomId
        ) {
          navigate(
            `/video-room/${updatedRequest.roomId}`
          );
        }
      } catch (error) {
        console.error(
          "[DoctorChat] video response failed:",
          error
        );
      } finally {
        setRespondingVideo(
          false
        );
      }
    };

  // ================= VIDEO REQUEST =================

  const handleVideoRequest =
    async () => {
      if (!appointmentId)
        return;

      setRespondingVideo(
        true
      );

      try {
        await requestVideoConsultation(
          appointmentId
        );

        setVideoStatus(
          "pending"
        );
      } catch (error) {
        console.error(
          "[DoctorChat] request failed:",
          error
        );
      } finally {
        setRespondingVideo(
          false
        );
      }
    };

  // ================= CANCEL VIDEO =================

  const handleCancelVideoRequest =
    async () => {
      if (!appointmentId)
        return;

      setRespondingVideo(
        true
      );

      try {
        await cancelVideoConsultation(
          appointmentId
        );

        setVideoStatus(null);

        setVideoRequest(null);
      } catch (error) {
        console.error(
          "[DoctorChat] cancel failed:",
          error
        );
      } finally {
        setRespondingVideo(
          false
        );
      }
    };

  // ================= ENTER SEND =================

  const handleKeyPress = (
    e
  ) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey
    ) {
      e.preventDefault();

      handleSendMessage();
    }
  };

  // ================= FORMATTERS =================

  const formatTime = (
    date
  ) => {
    return new Date(
      date
    ).toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const formatDate = (
    date
  ) => {
    const d = new Date(date);

    const today =
      new Date();

    const yesterday =
      new Date(today);

    yesterday.setDate(
      yesterday.getDate() -
        1
    );

    if (
      d.toDateString() ===
      today.toDateString()
    ) {
      return "Today";
    }

    if (
      d.toDateString() ===
      yesterday.toDateString()
    ) {
      return "Yesterday";
    }

    return d.toLocaleDateString();
  };

  const formatFileSize = (
    size
  ) => {
    const kb = size / 1024;

    if (kb < 1024) {
      return `${kb.toFixed(
        1
      )} KB`;
    }

    return `${(
      kb / 1024
    ).toFixed(1)} MB`;
  };

  // ================= GROUP MESSAGES =================

  const groupedMessages =
    messages.reduce(
      (groups, msg) => {
        const date =
          formatDate(
            msg.createdAt
          );

        if (
          !groups[date]
        ) {
          groups[date] = [];
        }

        groups[date].push(
          msg
        );

        return groups;
      },
      {}
    );

  const isImage = (
    mimetype
  ) =>
    mimetype?.startsWith(
      "image/"
    );

  const isPdf = (
    mimetype
  ) =>
    mimetype ===
    "application/pdf";

  return (
    <div className="chat-consultation-container">

      {/* HEADER */}

      <div className="chat-header">

        <div className="header-left">

          <button
            className="back-button"
            onClick={() =>
              navigate(-1)
            }
          >
            ←
          </button>

          <div className="header-info">

            <h2>
              Patient Chat
            </h2>

            <span
              className={`status ${onlineStatus}`}
            >
              ●{" "}
              {
                onlineStatus
              }
            </span>

          </div>

        </div>

        <div className="header-right">

          <button
            className="close-btn"
            onClick={() =>
              navigate(-1)
            }
            title="Close Chat"
          >
            ✕
          </button>

        </div>

      </div>

      {/* MESSAGES */}

      <div className="messages-container">

        {loading ? (
          <div className="loading">
            Loading messages...
          </div>
        ) : messages.length ===
          0 ? (
          <div className="empty-state">

            <div className="empty-icon">
              💬
            </div>

            <p>
              No messages yet.
              Wait for patient
              to start the
              conversation.
            </p>

          </div>
        ) : (
          <>
            {Object.entries(
              groupedMessages
            ).map(
              ([
                date,
                msgs,
              ]) => (
                <div
                  key={date}
                >

                  <div className="date-divider">
                    <span>
                      {date}
                    </span>
                  </div>

                  {msgs.map(
                    (msg) => (
                      <div
                        key={
                          msg._id
                        }
                        className={`message-wrapper ${
                          msg.senderRole ===
                          "doctor"
                            ? "sent"
                            : "received"
                        }`}
                      >

                        <div className="message-bubble">

                          {msg.attachment &&
                            isImage(
                              msg
                                .attachment
                                .mimetype
                            ) && (
                              <img
                                src={
                                  msg
                                    .attachment
                                    .url
                                }
                                alt="shared"
                                className="message-image"
                              />
                            )}

                          {msg.attachment &&
                            !isImage(
                              msg
                                .attachment
                                .mimetype
                            ) && (
                              <div className="message-file">

                                <div className="file-icon">
                                  {isPdf(
                                    msg
                                      .attachment
                                      .mimetype
                                  )
                                    ? "📄"
                                    : "📎"}
                                </div>

                                <div className="file-info">

                                  <p className="file-name">
                                    {
                                      msg
                                        .attachment
                                        .originalName
                                    }
                                  </p>

                                  <p className="file-size">
                                    {formatFileSize(
                                      msg
                                        .attachment
                                        .size
                                    )}
                                  </p>

                                </div>

                                <a
                                  href={
                                    msg
                                      .attachment
                                      .url
                                  }
                                  download
                                  className="download-btn"
                                >
                                  ⬇️
                                </a>

                              </div>
                            )}

                          {msg.message && (
                            <p className="message-text">
                              {
                                msg.message
                              }
                            </p>
                          )}

                          <span className="message-time">
                            {formatTime(
                              msg.createdAt
                            )}
                          </span>

                        </div>

                      </div>
                    )
                  )}

                </div>
              )
            )}
          </>
        )}

        <div
          ref={
            messagesEndRef
          }
        />

      </div>

      {/* VIDEO MODAL */}

      {videoStatus ===
        "pending" &&
        videoRequest && (
          <div className="incoming-call-overlay">

            <div className="incoming-call-modal">

              <div className="call-animation">
                📹
              </div>

              <h2>
                Incoming Video
                Consultation
              </h2>

              <p>
                Patient is
                requesting a
                live
                consultation
              </p>

              <div className="caller-info">

                <span>
                  👤
                </span>

                <strong>
                  {videoRequest.patientName ||
                    "Patient"}
                </strong>

              </div>

              <div className="video-request-buttons">

                <button
                  className="accept-btn"
                  onClick={() =>
                    handleVideoResponse(
                      "accept"
                    )
                  }
                  disabled={
                    respondingVideo
                  }
                >
                  {respondingVideo
                    ? "Processing..."
                    : "Accept"}
                </button>

                <button
                  className="reject-btn"
                  onClick={() =>
                    handleVideoResponse(
                      "reject"
                    )
                  }
                  disabled={
                    respondingVideo
                  }
                >
                  {respondingVideo
                    ? "Processing..."
                    : "Reject"}
                </button>

              </div>

            </div>

          </div>
        )}

      {/* VIDEO STATUS */}

      {videoStatus ===
        "accepted" && (
        <div className="video-status accepted">
          ✓ Video call
          accepted.
          Waiting for
          patient to join...
        </div>
      )}

      {videoStatus ===
        "rejected" && (
        <div className="video-status rejected">
          ✕ Video call
          rejected.
        </div>
      )}

      {/* FOOTER */}

      <div className="chat-footer">

        {/* FILE PREVIEW */}

        {selectedFile && (
          <div className="attachment-preview">

            {filePreview ? (
              <div className="attachment-image-card">

                <img
                  src={
                    filePreview
                  }
                  alt={
                    selectedFile.name
                  }
                  className="attachment-preview-image"
                />

                <div className="attachment-meta">

                  <div>

                    <p className="attachment-title">
                      Selected
                      image
                    </p>

                    <p className="attachment-subtitle">
                      {
                        selectedFile.name
                      }
                    </p>

                  </div>

                  <button
                    className="remove-preview"
                    onClick={() => {
                      setSelectedFile(
                        null
                      );

                      setFilePreview(
                        null
                      );
                    }}
                  >
                    ✕
                  </button>

                </div>

              </div>
            ) : (
              <div className="attachment-file-card">

                <div className="attachment-file-icon">
                  {selectedFile.type ===
                  "application/pdf"
                    ? "📄"
                    : "📎"}
                </div>

                <div className="attachment-file-info">

                  <p className="attachment-title">
                    {
                      selectedFile.name
                    }
                  </p>

                  <p className="attachment-subtitle">
                    {formatFileSize(
                      selectedFile.size
                    )}
                  </p>

                </div>

                <button
                  className="remove-preview"
                  onClick={() => {
                    setSelectedFile(
                      null
                    );

                    setFilePreview(
                      null
                    );
                  }}
                >
                  ✕
                </button>

              </div>
            )}

          </div>
        )}

        {/* VIDEO BUTTONS */}

        <div className="video-consultation-section">

          {videoStatus ===
          "pending" ? (
            <button
              className="cancel-video-btn"
              onClick={
                handleCancelVideoRequest
              }
              disabled={
                respondingVideo
              }
            >
              {respondingVideo
                ? "⏳ Cancelling..."
                : "❌ Cancel Video"}
            </button>
          ) : (
            <button
              className="video-consultation-btn"
              onClick={
                handleVideoRequest
              }
              disabled={
                respondingVideo
              }
            >
              {respondingVideo
                ? "⏳"
                : "📹 Request Video Consultation"}
            </button>
          )}

          <p className="video-consultation-info">
            Start a live video
            consultation with
            your patient.
          </p>

          {videoMessage && (
            <p className="video-consultation-info video-message">
              {
                videoMessage
              }
            </p>
          )}

        </div>

        {/* CHAT INPUT */}

        <div className="chat-input-area">

          <input
            ref={
              fileInputRef
            }
            type="file"
            onChange={
              handleFileSelect
            }
            style={{
              display:
                "none",
            }}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          />

          <div className="input-wrapper">

            <button
              className="attach-btn"
              onClick={() =>
                fileInputRef.current?.click()
              }
              disabled={
                sending ||
                uploading
              }
              title="Attach file"
            >
              📎
            </button>

            <input
              type="text"
              placeholder="Type a message..."
              value={input}
              onChange={(
                e
              ) =>
                setInput(
                  e.target
                    .value
                )
              }
              onKeyPress={
                handleKeyPress
              }
              disabled={
                sending
              }
            />

            <button
              className="send-btn"
              onClick={
                handleSendMessage
              }
              disabled={
                sending ||
                (!input.trim() &&
                  !selectedFile)
              }
            >
              {sending
                ? "↻"
                : "→"}
            </button>

          </div>

        </div>

      </div>

    </div>
  );
};

export default DoctorChatConsultation;
