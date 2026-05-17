import React, {
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";

import { useParams, useNavigate } from "react-router-dom";

import {
  getChatHistory,
  sendChatMessage,
  sendChatMessageWithFile,
} from "../services/chat.api";

import {
  getChatNotificationBody,
  notifyDesktopMessage,
} from "../../../utils/desktopNotifications";

import { resolveAttachmentUrl } from "../../../utils/attachmentUrl";

import {
  initSocket,
  getSocket,
  joinConsultationRoom,
  leaveConsultationRoom,
  joinUserRoom,
  leaveUserRoom,
} from "../../../services/socket";

import { getDoctorAppointments } from "../services/doctor.api";

import { authContext } from "../../auth/auth.context";

import "../styles/ChatConsultation.scss";

const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;

const renderMessageContent = (message) => {
  const text = String(message || "");

  if (!urlPattern.test(text)) {
    return <p className="message-text">{text}</p>;
  }

  urlPattern.lastIndex = 0;

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = urlPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const rawUrl = match[0];
    const href =
      rawUrl.startsWith("http://") || rawUrl.startsWith("https://")
        ? rawUrl
        : `https://${rawUrl}`;

    parts.push(
      <a
        key={`${match.index}-${rawUrl}`}
        href={href}
        target="_blank"
        rel="noreferrer"
        className="message-link"
      >
        {rawUrl}
      </a>,
    );

    lastIndex = match.index + rawUrl.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <p className="message-text">{parts}</p>;
};

const DoctorChatConsultation = () => {
  const { user } = useContext(authContext);

  const { appointmentId } = useParams();

  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);

  const [input, setInput] = useState("");

  const [loading, setLoading] = useState(true);

  const [sending, setSending] = useState(false);

  const [onlineStatus, setOnlineStatus] = useState("offline");

  const [otherUserId, setOtherUserId] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);

  const [filePreview, setFilePreview] = useState(null);

  const [uploading, setUploading] = useState(false);

  const messagesEndRef = useRef(null);

  const fileInputRef = useRef(null);

  const token = localStorage.getItem("token");

  const userId = localStorage.getItem("userId");

  // ================= SCROLL =================

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // ================= LOAD CHAT =================

  useEffect(() => {
    if (!appointmentId) return;

    const loadChatHistory = async () => {
      try {
        setLoading(true);

        const res = await getChatHistory(appointmentId);

        setMessages(res.data.messages || []);
      } catch (error) {
        console.error("[DoctorChat] failed loading chat:", error);
      } finally {
        setLoading(false);
      }
    };

    loadChatHistory();
  }, [appointmentId]);

  // ================= SOCKET CONNECTION =================

  useEffect(() => {
    if (!appointmentId || !token) return;

    const socket = getSocket() || initSocket(token);

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

      joinConsultationRoom(appointmentId);
    };

    const handleConnect = () => {
      console.log("[DoctorChat][socket-debug] connect handler", {
        appointmentId,
        roomId,
        socketId: socket.id,
      });

      joinRooms();

      setOnlineStatus("online");
    };

    // ===== NEW MESSAGE =====

    const handleNewMessage = (newMessage) => {
      const incomingAppointmentId = String(newMessage.appointmentId || "");
      const currentAppointmentId = String(appointmentId);
      const currentUserId = String(
        userId || localStorage.getItem("userId") || "",
      );

      console.log("[DoctorChat][socket-debug] newMessage received", {
        currentAppointmentId,
        msgAppointmentId: incomingAppointmentId,
        messageId: String(newMessage._id || ""),
        senderId: String(newMessage.senderId || ""),
      });

      if (incomingAppointmentId !== currentAppointmentId) {
        console.log(
          "[DoctorChat][socket-debug] newMessage rejected by appointment filter",
          {
            currentAppointmentId,
            msgAppointmentId: incomingAppointmentId,
          },
        );

        return;
      }

      if (String(newMessage.senderId || "") !== currentUserId) {
        void notifyDesktopMessage({
          title: newMessage.senderName || "New message",
          body: getChatNotificationBody(newMessage),
          tag: `appointment-${currentAppointmentId}`,
        });
      }

      setMessages((prev) => {
        // Exact duplicate prevention
        const alreadyExists = prev.some(
          (msg) => String(msg._id) === String(newMessage._id),
        );

        if (alreadyExists) {
          console.log(
            "[DoctorChat][socket-debug] newMessage ignored as duplicate",
            {
              messageId: String(newMessage._id || ""),
            },
          );

          return prev;
        }

        // Replace optimistic message
        const optimisticIndex = prev.findIndex(
          (msg) =>
            String(msg._id).startsWith("local-") &&
            String(msg.senderId) === String(newMessage.senderId) &&
            msg.message === newMessage.message,
        );

        if (optimisticIndex !== -1) {
          console.log(
            "[DoctorChat][socket-debug] replacing optimistic message",
            {
              localIndex: optimisticIndex,
              messageId: String(newMessage._id || ""),
            },
          );

          const updated = [...prev];

          updated[optimisticIndex] = newMessage;

          return updated;
        }

        console.log("[DoctorChat][socket-debug] appending newMessage", {
          messageId: String(newMessage._id || ""),
        });

        return [...prev, newMessage];
      });
    };

    // ===== VIDEO REQUEST RECEIVED =====

    // ===== DISCONNECT =====

    const handleDisconnect = () => {
      setOnlineStatus("offline");
    };

    const handleUserOnline = (payload) => {
      if (!payload || !payload.userId) return;
      if (otherUserId && String(payload.userId) === String(otherUserId)) {
        setOnlineStatus("online");
      }
    };

    const handleUserOffline = (payload) => {
      if (!payload || !payload.userId) return;
      if (otherUserId && String(payload.userId) === String(otherUserId)) {
        setOnlineStatus("offline");
      }
    };

    console.log("[DoctorChat][socket-debug] registering listeners", {
      appointmentId,
      roomId,
      socketId: socket?.id,
      connected: Boolean(socket?.connected),
    });

    socket.on("connect", handleConnect);

    socket.on("newMessage", handleNewMessage);

    socket.on("disconnect", handleDisconnect);
    socket.on("userOnline", handleUserOnline);
    socket.on("userOffline", handleUserOffline);

    // Join now as well as on future reconnects. Reused sockets may already
    // be connected before this component mounts.
    joinRooms();

    if (socket.connected) {
      setOnlineStatus("online");
    }

    // Resolve other participant (patient) id from messages or appointment list
    const resolveOtherUser = async () => {
      const currentUserId = String(localStorage.getItem("userId") || "");

      if (messages && messages.length > 0) {
        const msg =
          messages.find((m) => String(m.senderId) !== currentUserId) ||
          messages[0];
        if (msg) {
          const other =
            String(msg.senderId) === currentUserId
              ? msg.receiverId
              : msg.senderId;
          if (other) setOtherUserId(String(other));
        }
      }

      if (!otherUserId) {
        try {
          const res = await getDoctorAppointments();
          const appts = res.data || res;
          const found = appts.find(
            (a) => String(a.id || a._id) === String(appointmentId),
          );
          if (found && found.patient) {
            setOtherUserId(String(found.patient._id || found.patient.id));
          }
        } catch (err) {
          // ignore
        }
      }

      // Query presence map
      try {
        const s = getSocket();
        if (s && typeof s.emit === "function") {
          s.emit("getPresence", (err, map) => {
            if (err) return;
            const list = Array.isArray(map) ? map : [];
            if (otherUserId) {
              const found = list.find(
                (p) => String(p.userId) === String(otherUserId),
              );
              if (found) setOnlineStatus("online");
            }
          });
        }
      } catch (err) {
        // ignore
      }
    };

    void resolveOtherUser();

    return () => {
      console.log("[DoctorChat][socket-debug] cleanup listeners", {
        appointmentId,
        roomId,
        userId,
        socketId: socket?.id,
      });

      socket.off("connect", handleConnect);

      socket.off("newMessage", handleNewMessage);

      socket.off("disconnect", handleDisconnect);

      socket.off("userOnline", handleUserOnline);
      socket.off("userOffline", handleUserOffline);

      leaveUserRoom(userId);

      leaveConsultationRoom(appointmentId);
    };
  }, [appointmentId, token, userId, navigate]);

  // ================= FILE SELECT =================

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");

      return;
    }

    setSelectedFile(file);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();

      reader.onload = (event) => {
        setFilePreview(event.target.result);
      };

      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  // ================= SEND MESSAGE =================

  const handleSendMessage = async () => {
    if (!input.trim() && !selectedFile) {
      return;
    }

    const text = input.trim();

    setInput("");

    setSending(true);
    setUploading(true);

    const tempId = `local-${Date.now()}`;

    const optimisticMessage = {
      _id: tempId,
      appointmentId,
      senderId: userId,
      senderName: localStorage.getItem("username") || "Doctor",
      senderRole: localStorage.getItem("role") || "doctor",
      message: text,
      createdAt: new Date().toISOString(),
    };

    if (selectedFile) {
      optimisticMessage.attachment = {
        originalName: selectedFile.name,
        size: selectedFile.size,
        mimetype: selectedFile.type,
        url: filePreview || null,
      };
    }

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      if (selectedFile) {
        const formData = new FormData();

        formData.append("appointmentId", appointmentId);

        formData.append("message", text);

        formData.append("file", selectedFile);

        const response = await sendChatMessageWithFile(formData);

        const serverMessage = response.data?.chatMessage;
        if (serverMessage) {
          const socket = getSocket();
          socket?.emit("sendMessage", {
            roomId: `consultation-${appointmentId}`,
            message: serverMessage,
          });
        }

        setSelectedFile(null);

        setFilePreview(null);
      } else {
        const response = await sendChatMessage(appointmentId, text);

        const serverMessage = response.data?.chatMessage;
        if (serverMessage) {
          const socket = getSocket();
          socket?.emit("sendMessage", {
            roomId: `consultation-${appointmentId}`,
            message: serverMessage,
          });
        }
      }
    } catch (error) {
      console.error("[DoctorChat] send failed:", error);

      setMessages((prev) => prev.filter((msg) => msg._id !== tempId));

      setInput(text);

      const serverMessage = error?.response?.data?.message;

      alert(`Failed to send message: ${serverMessage || error.message}`);
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  const doctorVideoUrl =
    user?.videoUrl ||
    user?.video_url ||
    (() => {
      try {
        const savedUser = JSON.parse(localStorage.getItem("user") || "null");
        return savedUser?.videoUrl || savedUser?.video_url || "";
      } catch {
        return "";
      }
    })();

  const handleSendVideoUrl = async () => {
    if (!doctorVideoUrl) {
      alert("Please add your video consultation URL in your profile first.");
      return;
    }

    try {
      const response = await sendChatMessage(appointmentId, doctorVideoUrl);

      const serverMessage = response.data?.chatMessage;
      if (serverMessage) {
        const socket = getSocket();
        socket?.emit("sendMessage", {
          roomId: `consultation-${appointmentId}`,
          message: serverMessage,
        });
      }
    } catch (error) {
      console.error("[DoctorChat] video url send failed:", error);
      alert(
        error?.response?.data?.message ||
          "Unable to send video consultation URL.",
      );
    }
  };

  // ================= ENTER SEND =================

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      handleSendMessage();
    }
  };

  // ================= FORMATTERS =================

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date) => {
    const d = new Date(date);

    const today = new Date();

    const yesterday = new Date(today);

    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return "Today";
    }

    if (d.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }

    return d.toLocaleDateString();
  };

  const formatFileSize = (size) => {
    const kb = size / 1024;

    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`;
    }

    return `${(kb / 1024).toFixed(1)} MB`;
  };

  // ================= GROUP MESSAGES =================

  const groupedMessages = messages.reduce((groups, msg) => {
    const date = formatDate(msg.createdAt);

    if (!groups[date]) {
      groups[date] = [];
    }

    groups[date].push(msg);

    return groups;
  }, {});

  const isImage = (mimetype) => mimetype?.startsWith("image/");

  const isPdf = (mimetype) => mimetype === "application/pdf";

  return (
    <>
      <div className="chat-consultation-container">
        {/* HEADER */}

        <div className="chat-header">
          <div className="header-left">
            <button className="back-button" onClick={() => navigate(-1)}>
              ←
            </button>

            <div className="header-info">
              <h2>Patient Chat</h2>

              <span className={`status ${onlineStatus}`}>● {onlineStatus}</span>
            </div>
          </div>

          <div className="header-right">
            <button
              className="close-btn"
              onClick={() => navigate(-1)}
              title="Close Chat"
            >
              ✕
            </button>
          </div>
        </div>

        {/* MESSAGES */}

        <div className="messages-container">
          {loading ? (
            <div className="loading">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💬</div>

              <p>
                No messages yet. Wait for patient to start the conversation.
              </p>
            </div>
          ) : (
            <>
              {Object.entries(groupedMessages).map(([date, msgs]) => (
                <div key={date}>
                  <div className="date-divider">
                    <span>{date}</span>
                  </div>

                  {msgs.map((msg) => (
                    <div
                      key={msg._id}
                      className={`message-wrapper ${
                        msg.senderRole === "doctor" ? "sent" : "received"
                      }`}
                    >
                      <div className="message-bubble">
                        {msg.attachment && isImage(msg.attachment.mimetype) && (
                          <img
                            src={resolveAttachmentUrl(msg.attachment.url)}
                            alt="shared"
                            className="message-image"
                          />
                        )}

                        {msg.attachment &&
                          !isImage(msg.attachment.mimetype) && (
                            <div className="message-file">
                              <div className="file-icon">
                                {isPdf(msg.attachment.mimetype) ? "📄" : "📎"}
                              </div>

                              <div className="file-info">
                                <p className="file-name">
                                  {msg.attachment.originalName}
                                </p>

                                <p className="file-size">
                                  {formatFileSize(msg.attachment.size)}
                                </p>
                              </div>

                              <a
                                href={resolveAttachmentUrl(msg.attachment.url)}
                                download
                                className="download-btn"
                              >
                                ⬇️
                              </a>
                            </div>
                          )}

                        {msg.message && renderMessageContent(msg.message)}

                        <span className="message-time">
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Video UI removed for doctor page — only compact icon remains in footer */}

        {/* FOOTER */}

        <div className="chat-footer">
          {/* FILE PREVIEW */}

          {selectedFile && (
            <div className="attachment-preview">
              {filePreview ? (
                <div className="attachment-image-card">
                  <img
                    src={filePreview}
                    alt={selectedFile.name}
                    className="attachment-preview-image"
                  />

                  <div className="attachment-meta">
                    <div>
                      <p className="attachment-title">Selected image</p>

                      <p className="attachment-subtitle">{selectedFile.name}</p>
                    </div>

                    <button
                      className="remove-preview"
                      onClick={() => {
                        setSelectedFile(null);

                        setFilePreview(null);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ) : (
                <div className="attachment-file-card">
                  <div className="attachment-file-icon">
                    {selectedFile.type === "application/pdf" ? "📄" : "📎"}
                  </div>

                  <div className="attachment-file-info">
                    <p className="attachment-title">{selectedFile.name}</p>

                    <p className="attachment-subtitle">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>

                  <button
                    className="remove-preview"
                    onClick={() => {
                      setSelectedFile(null);

                      setFilePreview(null);
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          )}

          {/* VIDEO BUTTONS */}
          {/* VIDEO CTA removed - compact video icon added to input area */}

          {/* CHAT INPUT */}

          <div className="chat-input-area">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              style={{
                display: "none",
              }}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            />

            <div className="input-wrapper">
              <button
                className="attach-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending || uploading}
                title="Attach file"
              >
                📎
              </button>

              <button
                className="attach-btn"
                onClick={handleSendVideoUrl}
                title="Send video consultation URL"
                style={{ marginLeft: "6px" }}
              >
                📹
              </button>

              <input
                type="text"
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={sending}
              />

              <button
                className="send-btn"
                onClick={handleSendMessage}
                disabled={sending || (!input.trim() && !selectedFile)}
              >
                {sending ? "↻" : "→"}
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* video overlay disabled on doctor page */}
    </>
  );
};

export default DoctorChatConsultation;
