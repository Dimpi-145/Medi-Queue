import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  initSocket,
  joinConsultationRoom,
  leaveConsultationRoom,
  joinUserRoom,
  leaveUserRoom,
  getSocket,
} from "../../../services/socket";

import { getMyAppointments } from "../services/appointment.api";

import {
  getChatHistory,
  sendChatMessage,
  sendChatMessageWithFile,
} from "../services/chat.api";

import {
  requestVideoConsultation,
  getVideoRequestStatus,
  cancelVideoConsultation,
  respondToVideoRequest,
} from "../services/video.api";

import {
  getChatNotificationBody,
  notifyDesktopMessage,
} from "../../../utils/desktopNotifications";

import VideoRoom from "../../video/VideoRoom";

import { resolveAttachmentUrl } from "../../../utils/attachmentUrl";

import "../styles/ChatConsultation.scss";

const ChatConsultation = () => {
  const { appointmentId } = useParams();

  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);

  const [input, setInput] = useState("");

  const [loading, setLoading] = useState(true);

  const [sending, setSending] = useState(false);

  const [videoStatus, setVideoStatus] = useState(null);
  const [videoRequest, setVideoRequest] = useState(null);
  const [videoOverlayRoom, setVideoOverlayRoom] = useState(null);

  const [videoLoading, setVideoLoading] = useState(false);

  const [onlineStatus, setOnlineStatus] = useState("offline");

  const [otherUserId, setOtherUserId] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);

  const [videoMessage, setVideoMessage] = useState("");

  const [filePreview, setFilePreview] = useState(null);

  const [uploading, setUploading] = useState(false);

  const messagesEndRef = useRef(null);

  const socketRef = useRef(null);

  const userId = useRef(null);

  const fileInputRef = useRef(null);

  // Scroll to bottom

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load chat history

  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        setLoading(true);

        const res = await getChatHistory(appointmentId);

        setMessages(res.data.messages || []);
      } catch (error) {
        console.error("Failed to load chat history:", error);
      } finally {
        setLoading(false);
      }
    };

    loadChatHistory();
  }, [appointmentId]);

  // Load video request status

  useEffect(() => {
    const loadVideoStatus = async () => {
      try {
        const res = await getVideoRequestStatus(appointmentId);

        setVideoStatus(res.data.videoRequest?.status || null);
      } catch (error) {
        setVideoStatus(null);
      }
    };

    loadVideoStatus();
  }, [appointmentId]);

  // Socket connection

  useEffect(() => {
    if (!appointmentId) return;

    const token = localStorage.getItem("token");
    const socket = initSocket(token);
    socketRef.current = socket;

    userId.current = localStorage.getItem("userId");
    const roomId = `consultation-${appointmentId}`;

    console.log("[PatientChat][socket-debug] effect start", {
      appointmentId,
      roomId,
      userId: userId.current,
      hasToken: Boolean(token),
      hasSocket: Boolean(socket),
      connected: Boolean(socket?.connected),
      socketId: socket?.id,
    });

    const joinRooms = () => {
      console.log("[PatientChat][socket-debug] joinRooms", {
        appointmentId,
        roomId,
        userId: userId.current,
        connected: Boolean(socket?.connected),
        socketId: socket?.id,
      });

      if (userId.current) {
        joinUserRoom(userId.current);
      }

      joinConsultationRoom(appointmentId);
    };

    const handleConnect = () => {
      console.log("[PatientChat][socket-debug] connect handler", {
        appointmentId,
        roomId,
        socketId: socket.id,
      });
      joinRooms();
      setOnlineStatus("online");
    };

    const handleNewMessage = (newMessage) => {
      const msgApptId = String(newMessage.appointmentId || "");
      const msgConsultId = String(newMessage.consultationId || "");
      const currentId = String(appointmentId);
      const currentUserId = String(
        userId.current || localStorage.getItem("userId") || "",
      );

      console.log("[PatientChat][socket-debug] newMessage received", {
        currentAppointmentId: currentId,
        msgAppointmentId: msgApptId,
        msgConsultationId: msgConsultId,
        messageId: String(newMessage._id || ""),
        senderId: String(newMessage.senderId || ""),
      });

      if (msgApptId !== currentId && msgConsultId !== currentId) {
        console.log(
          "[PatientChat][socket-debug] newMessage rejected by appointment filter",
          {
            currentAppointmentId: currentId,
            msgAppointmentId: msgApptId,
            msgConsultationId: msgConsultId,
          },
        );

        return;
      }

      if (String(newMessage.senderId || "") !== currentUserId) {
        void notifyDesktopMessage({
          title: newMessage.senderName || "New message",
          body: getChatNotificationBody(newMessage),
          tag: `appointment-${currentId}`,
        });
      }

      setMessages((prev) => {
        // Exact-match dedupe by _id
        if (prev.some((msg) => String(msg._id) === String(newMessage._id))) {
          console.log(
            "[PatientChat][socket-debug] newMessage ignored as duplicate",
            {
              messageId: String(newMessage._id || ""),
            },
          );

          return prev;
        }

        // Replace optimistic local message if matching (same sender, text, within 10s)
        const localIndex = prev.findIndex(
          (msg) =>
            String(msg._id).startsWith("local-") &&
            String(msg.senderId) === String(newMessage.senderId) &&
            msg.message === newMessage.message &&
            Math.abs(
              new Date(msg.createdAt).getTime() -
                new Date(newMessage.createdAt).getTime(),
            ) < 10000,
        );

        if (localIndex !== -1) {
          console.log(
            "[PatientChat][socket-debug] replacing optimistic message",
            {
              localIndex,
              messageId: String(newMessage._id || ""),
            },
          );

          const copy = [...prev];
          copy[localIndex] = newMessage;
          return copy;
        }

        console.log("[PatientChat][socket-debug] appending newMessage", {
          messageId: String(newMessage._id || ""),
        });

        return [...prev, newMessage];
      });
    };

    const handleVideoAccepted = (payload) => {
      if (payload.roomId) {
        setVideoOverlayRoom(payload.roomId);
      }
    };

    const handleVideoRequestReceived = (payload) => {
      if (String(payload.appointmentId) === String(appointmentId)) {
        setVideoRequest({
          _id: payload.videoRequestId,
          appointmentId: payload.appointmentId,
          status: "pending",
          doctorName: payload.doctorName || "Doctor",
          initiator: payload.initiator,
        });

        setVideoStatus("pending");
      }
    };

    const handleVideoRejected = () => {
      setVideoStatus("rejected");

      setVideoMessage("Doctor declined your video request.");
    };

    const handleVideoCancelled = () => {
      setVideoStatus(null);
      setVideoRequest(null);
      setVideoMessage("Video request cancelled.");
    };

    const handleVideoEnded = () => {
      setVideoStatus(null);
      setVideoRequest(null);
      setVideoMessage("Video call ended.");
    };

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

    console.log("[PatientChat][socket-debug] registering listeners", {
      appointmentId,
      roomId,
      socketId: socket?.id,
      connected: Boolean(socket?.connected),
    });

    socket.on("connect", handleConnect);
    socket.on("newMessage", handleNewMessage);
    socket.on("videoRequestAccepted", handleVideoAccepted);
    socket.on("videoRequestReceived", handleVideoRequestReceived);
    socket.on("videoRequestRejected", handleVideoRejected);
    socket.on("videoRequestCancelled", handleVideoCancelled);
    socket.on("videoCallEnded", handleVideoEnded);
    socket.on("disconnect", handleDisconnect);
    socket.on("userOnline", handleUserOnline);
    socket.on("userOffline", handleUserOffline);

    // Join now as well as on future reconnects. This is the key fix for
    // reused sockets whose original "connect" event already happened.
    joinRooms();
    if (socket.connected) {
      setOnlineStatus("online");
    }

    // Try to resolve the other participant (doctor) userId from messages
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
        // fallback: fetch my appointments and find doctor for this appointment
        try {
          const res = await getMyAppointments();
          const appts = res.data || res;
          const found = appts.find(
            (a) => String(a.id || a._id) === String(appointmentId),
          );
          if (found && found.doctorId) {
            setOtherUserId(String(found.doctorId));
          }
        } catch (err) {
          // ignore
        }
      }

      // Query current presence map once
      try {
        const s = socketRef.current || getSocket();
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
      try {
        console.log("[PatientChat][socket-debug] cleanup listeners", {
          appointmentId,
          roomId,
          userId: userId.current,
          socketId: socket?.id,
        });

        socket.off("connect", handleConnect);
        socket.off("newMessage", handleNewMessage);
        socket.off("videoRequestAccepted", handleVideoAccepted);
        socket.off("videoRequestReceived", handleVideoRequestReceived);
        socket.off("videoRequestRejected", handleVideoRejected);
        socket.off("videoRequestCancelled", handleVideoCancelled);
        socket.off("videoCallEnded", handleVideoEnded);
        socket.off("disconnect", handleDisconnect);
        socket.off("userOnline", handleUserOnline);
        socket.off("userOffline", handleUserOffline);
        leaveUserRoom(userId.current);
        leaveConsultationRoom(appointmentId);
      } catch (err) {
        // ignore
      }
    };
  }, [appointmentId, navigate]);

  // File select

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

  // Send message

  const handleSendMessage = async () => {
    if (!input.trim() && !selectedFile) return;

    const text = input.trim();

    setInput("");

    setSending(true);

    // Optimistic message id
    const tempId = `local-${Date.now()}`;

    try {
      if (selectedFile) {
        // Optimistic file message
        const optimistic = {
          _id: tempId,
          appointmentId,
          consultationId: appointmentId,
          senderId: localStorage.getItem("userId"),
          senderName: localStorage.getItem("username") || "You",
          receiverId: null,
          receiverName: "",
          senderRole: localStorage.getItem("role") || "patient",
          message: text,
          attachment: {
            originalName: selectedFile.name,
            size: selectedFile.size,
            mimetype: selectedFile.type,
            url: filePreview || null,
          },
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, optimistic]);

        const formData = new FormData();
        formData.append("appointmentId", appointmentId);
        formData.append("message", text);
        formData.append("file", selectedFile);

        try {
          const response = await sendChatMessageWithFile(formData);

          const serverMessage = response.data?.chatMessage;
          if (serverMessage) {
            const socket = socketRef.current || getSocket();
            socket?.emit("sendMessage", {
              roomId: `consultation-${appointmentId}`,
              message: serverMessage,
            });
          }

          setSelectedFile(null);
          setFilePreview(null);
        } catch (err) {
          // remove optimistic message on error
          setMessages((prev) => prev.filter((m) => m._id !== tempId));
          throw err;
        }
      } else {
        // Optimistically show message for sender
        const optimistic = {
          _id: tempId,
          appointmentId,
          consultationId: appointmentId,
          senderId: localStorage.getItem("userId"),
          senderName: localStorage.getItem("username") || "You",
          receiverId: null,
          receiverName: "",
          senderRole: localStorage.getItem("role") || "patient",
          message: text,
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, optimistic]);

        const response = await sendChatMessage(appointmentId, text);

        const serverMessage = response.data?.chatMessage;
        if (serverMessage) {
          const socket = socketRef.current || getSocket();
          socket?.emit("sendMessage", {
            roomId: `consultation-${appointmentId}`,
            message: serverMessage,
          });
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      const serverMsg = error?.response?.data?.message;
      alert("Failed to send message: " + (serverMsg || error.message));

      setInput(text);

      // remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
    } finally {
      setSending(false);
    }
  };

  // Request video

  const handleVideoRequest = async () => {
    if (!appointmentId) return;

    setVideoLoading(true);

    setVideoMessage("");

    try {
      const response = await requestVideoConsultation(appointmentId);

      const request = response.data?.videoRequest || null;

      // FORCE pending state

      setVideoRequest(request);
      setVideoStatus(request?.status || "pending");

      setVideoMessage("Video consultation request sent successfully.");
    } catch (error) {
      console.error("Failed to request video:", error);

      // If backend says already pending,
      // still show cancel button

      if (error.response?.data?.message?.includes("already pending")) {
        setVideoStatus("pending");
        setVideoMessage("A video consultation request is already pending.");
      }

      setVideoMessage(
        error.response?.data?.message || "Unable to send video request.",
      );
    } finally {
      setVideoLoading(false);
    }
  };

  // Cancel request

  const handleCancelVideoRequest = async () => {
    if (!appointmentId) return;

    setVideoLoading(true);

    try {
      await cancelVideoConsultation(appointmentId);

      setVideoStatus(null);

      setVideoMessage("Video consultation request cancelled.");
    } catch (error) {
      console.error("Failed to cancel request:", error);

      setVideoMessage("Unable to cancel request.");
    } finally {
      setVideoLoading(false);
    }
  };

  // Enter send

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      handleSendMessage();
    }
  };

  // Handle incoming doctor-initiated video request (accept/reject)
  const handleVideoResponse = async (action) => {
    if (!videoRequest?._id) return;

    setVideoLoading(true);

    try {
      const res = await respondToVideoRequest(videoRequest._id, action);

      const updated = res.data.videoRequest;

      setVideoRequest(updated);

      if (action === "accept" && updated?.roomId) {
        navigate(`/video-room/${updated.roomId}`);
      } else if (action === "reject") {
        setVideoStatus("rejected");
      }
    } catch (error) {
      console.error("Failed to respond to video request:", error);
    } finally {
      setVideoLoading(false);
    }
  };

  // Format time

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format date

  const formatDate = (date) => {
    const d = new Date(date);

    const today = new Date();

    const yesterday = new Date(today);

    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return "Today";
    } else if (d.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return d.toLocaleDateString();
    }
  };

  // Group messages

  const groupedMessages = messages.reduce((groups, msg) => {
    const date = formatDate(msg.createdAt);

    if (!groups[date]) {
      groups[date] = [];
    }

    groups[date].push(msg);

    return groups;
  }, {});

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
              <h2>Doctor Consultation</h2>

              <span className={`status ${onlineStatus}`}>● {onlineStatus}</span>
            </div>
          </div>

          <div className="header-right">
            <button className="close-btn" onClick={() => navigate(-1)}>
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

              <p>No messages yet. Start the conversation!</p>
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
                      className={`message-wrapper ${msg.senderRole === "patient" ? "sent" : "received"}`}
                    >
                      <div className="message-bubble">
                        {msg.attachment &&
                          msg.attachment.mimetype &&
                          msg.attachment.url &&
                          (msg.attachment.mimetype.startsWith("image/") ? (
                            <img
                              src={resolveAttachmentUrl(msg.attachment.url)}
                              alt="shared"
                              className="message-image"
                            />
                          ) : (
                            <div className="message-file">
                              <div className="file-icon">
                                {msg.attachment.mimetype === "application/pdf"
                                  ? "📄"
                                  : "📎"}
                              </div>
                              <div className="file-info">
                                <p className="file-name">
                                  {msg.attachment.originalName}
                                </p>
                                <p className="file-size">
                                  {(msg.attachment.size / 1024).toFixed(2)} KB
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
                          ))}

                        {msg.message && (
                          <p className="message-text">{msg.message}</p>
                        )}

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

        {/* FOOTER */}

        <div className="chat-footer">
          {videoStatus === "pending" &&
            videoRequest &&
            videoRequest.initiator === "doctor" && (
              <div className="incoming-call-overlay">
                <div className="incoming-call-modal">
                  <div className="call-animation">📹</div>
                  <h2>Incoming Video Consultation</h2>
                  <p>Doctor is requesting a live consultation</p>
                  <div className="caller-info">
                    <span>👤</span>
                    <strong>{videoRequest.doctorName || "Doctor"}</strong>
                  </div>
                  <div className="video-request-buttons">
                    <button
                      className="accept-btn"
                      onClick={() => handleVideoResponse("accept")}
                      disabled={videoLoading}
                    >
                      {videoLoading ? "Processing..." : "Accept"}
                    </button>
                    <button
                      className="reject-btn"
                      onClick={() => handleVideoResponse("reject")}
                      disabled={videoLoading}
                    >
                      {videoLoading ? "Processing..." : "Reject"}
                    </button>
                  </div>
                </div>
              </div>
            )}

          {videoStatus === "pending" &&
            !(videoRequest && videoRequest.initiator === "doctor") && (
              <div className="video-status pending">
                ⏳ Video request sent. Waiting for doctor to accept...
              </div>
            )}

          {videoStatus === "rejected" && (
            <div className="video-status rejected">
              ❌ Doctor declined the video consultation request.
            </div>
          )}

          {/* VIDEO SECTION */}
          {/* VIDEO CTA removed - compact video icon added to input area */}

          {/* INPUT */}

          <div className="chat-input-area">
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
                        <p className="attachment-subtitle">
                          {selectedFile.name}
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
                  </div>
                ) : (
                  <div className="attachment-file-card">
                    <div className="attachment-file-icon">
                      {selectedFile.type === "application/pdf" ? "📄" : "📎"}
                    </div>
                    <div className="attachment-file-info">
                      <p className="attachment-title">{selectedFile.name}</p>
                      <p className="attachment-subtitle">
                        {(selectedFile.size / 1024).toFixed(2)} KB
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

            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              style={{
                display: "none",
              }}
            />

            <div className="input-wrapper">
              <button
                className="attach-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                📎
              </button>

              <input
                type="text"
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
              />

              <button className="send-btn" onClick={handleSendMessage}>
                →
              </button>
            </div>
          </div>
        </div>
      </div>
      {videoOverlayRoom && (
        <VideoRoom
          roomId={videoOverlayRoom}
          onClose={() => setVideoOverlayRoom(null)}
        />
      )}
    </>
  );
};

export default ChatConsultation;
