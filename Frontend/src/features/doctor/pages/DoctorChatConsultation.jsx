import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";

import {
  getChatHistory,
  sendChatMessage,
  sendChatMessageWithFile,
} from "../services/chat.api";

import {
  getVideoRequestStatus,
  respondToVideoRequest,
} from "../services/video.api";
import { requestVideoConsultation, cancelVideoConsultation } from "../services/video.api";

import "../styles/ChatConsultation.scss";

const DoctorChatConsultation = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [videoRequest, setVideoRequest] = useState(null);
  const [videoStatus, setVideoStatus] = useState(null);
  const [videoMessage, setVideoMessage] = useState("");

  const [onlineStatus, setOnlineStatus] = useState("offline");
  const [respondingVideo, setRespondingVideo] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, _setUploading] = useState(false);

  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const userId = useRef(null);
  const fileInputRef = useRef(null);

  // Scroll to latest message
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

        const videoReq = res.data.videoRequest;

        setVideoRequest(videoReq);
        setVideoStatus(videoReq?.status || null);
      } catch (_) {
          setVideoRequest(null);
          setVideoStatus(null);
        }
    };

    loadVideoStatus();
  }, [appointmentId]);

  // Socket connection
  useEffect(() => {
    if (!appointmentId) return;

    const socket = io("http://localhost:3000");

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to socket server");

      const userIdFromStorage = localStorage.getItem("userId");

      if (userIdFromStorage) {
        userId.current = userIdFromStorage;

        socket.emit("joinUserRoom", userIdFromStorage);
      }

      socket.emit(
        "joinConsultationRoom",
        `consultation-${appointmentId}`
      );

      setOnlineStatus("online");
    });

    // New message listener
    socket.on("newMessage", (newMessage) => {
      const msgApptId = String(newMessage.appointmentId || "");
      const msgConsultId = String(newMessage.consultationId || "");
      const currentId = String(appointmentId);

      if (msgApptId !== currentId && msgConsultId !== currentId) return;

      setMessages((prev) => {
        if (prev.some((msg) => String(msg._id) === String(newMessage._id))) {
          return prev;
        }

        const localIndex = prev.findIndex((msg) =>
          String(msg._id).startsWith("local-") &&
          String(msg.senderId) === String(newMessage.senderId) &&
          msg.message === newMessage.message &&
          Math.abs(new Date(msg.createdAt).getTime() - new Date(newMessage.createdAt).getTime()) < 10000
        );

        if (localIndex !== -1) {
          const copy = [...prev];
          copy[localIndex] = newMessage;
          return copy;
        }

        return [...prev, newMessage];
      });
    });

    // Video request listener
    socket.on("videoRequestReceived", (payload) => {
      if (payload.appointmentId === appointmentId) {
        setVideoRequest({
          _id: payload.videoRequestId,
          appointmentId: payload.appointmentId,
          status: "pending",
          patientName: payload.patientName,
        });

        setVideoStatus("pending");
      }
    });

    // Video cancelled listener - close incoming popup if the appointment matches
    socket.on("videoRequestCancelled", (payload) => {
      if (payload.appointmentId === appointmentId) {
        setVideoStatus(null);
        setVideoRequest(null);
      }
    });

    // Video accepted -> navigate to video room
    socket.on("videoRequestAccepted", (payload) => {
      if (payload.roomId) {
        navigate(`/video-room/${payload.roomId}`);
      }
    });

    // Video rejected
    socket.on("videoRequestRejected", (payload) => {
      setVideoStatus("rejected");
      setVideoRequest(null);
    });

    // Video call ended
    socket.on("videoCallEnded", (payload) => {
      setVideoStatus(null);
      setVideoRequest(null);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from socket server");

      setOnlineStatus("offline");
    });

    return () => {
      socket.emit("leaveUserRoom", userId.current);

      socket.emit(
        "leaveConsultationRoom",
        `consultation-${appointmentId}`
      );

      socket.disconnect();
    };
  }, [appointmentId]);

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

    const tempId = `local-${Date.now()}`;

    try {
      // Optimistic message for sender (include attachment preview if any)
      const optimistic = {
        _id: tempId,
        appointmentId,
        consultationId: appointmentId,
        senderId: localStorage.getItem("userId"),
        senderName: localStorage.getItem("username") || "You",
        receiverId: null,
        receiverName: "",
        senderRole: localStorage.getItem("role") || "doctor",
        message: text,
        ...(selectedFile
          ? {
              attachment: {
                originalName: selectedFile.name,
                size: selectedFile.size,
                mimetype: selectedFile.type,
                url: filePreview || null,
              },
            }
          : {}),
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, optimistic]);

      if (selectedFile) {
        const formData = new FormData();
        formData.append("appointmentId", appointmentId);
        formData.append("message", text);
        formData.append("file", selectedFile);

        try {
          await sendChatMessageWithFile(formData);

          setSelectedFile(null);
          setFilePreview(null);
        } catch (err) {
          // remove optimistic message on error
          setMessages((prev) => prev.filter((m) => m._id !== tempId));
          throw err;
        }
      } else {
        await sendChatMessage(appointmentId, text);
      }
    } catch (error) {
      console.error(
        "Failed to send message:",
        error
      );

      // Prefer server-provided message when available
      const serverMsg = error?.response?.data?.message;
      alert("Failed to send message: " + (serverMsg || error.message));

      setInput(text);

      // remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
    } finally {
      setSending(false);
    }
  };

  // Video accept/reject
  const handleVideoResponse = async (
    action
  ) => {
    if (!videoRequest?._id) return;

    setRespondingVideo(true);

    try {
      const res =
        await respondToVideoRequest(
          videoRequest._id,
          action
        );

      const updatedRequest =
        res.data.videoRequest;

      if (action === "accept") {
        setVideoStatus("accepted");

        setVideoRequest(updatedRequest);

        if (updatedRequest.roomId) {
          navigate(
            `/video-room/${updatedRequest.roomId}`
          );
        }
      } else {
        setVideoStatus("rejected");

        setVideoRequest(updatedRequest);
      }
    } catch (error) {
      console.error(
        "Failed to respond to video request:",
        error
      );
    } finally {
      setRespondingVideo(false);
    }
  };

  // Doctor initiate video request
  const handleVideoRequest = async () => {
    if (!appointmentId) return;

    setRespondingVideo(true);

    try {
      await requestVideoConsultation(appointmentId);

      // force pending
      setVideoStatus("pending");
    } catch (err) {
      console.error("Failed to initiate video request:", err);
    } finally {
      setRespondingVideo(false);
    }
  };

  const handleCancelVideoRequest = async () => {
    if (!appointmentId) return;

    setRespondingVideo(true);

    try {
      await cancelVideoConsultation(appointmentId);

      setVideoStatus(null);
      setVideoRequest(null);
    } catch (err) {
      console.error("Failed to cancel video request:", err);
    } finally {
      setRespondingVideo(false);
    }
  };

  // Enter send
  const handleKeyPress = (e) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey
    ) {
      e.preventDefault();

      handleSendMessage();
    }
  };

  // Time formatter
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // Date formatter
  const formatDate = (date) => {
    const d = new Date(date);

    const today = new Date();

    const yesterday = new Date(today);

    yesterday.setDate(
      yesterday.getDate() - 1
    );

    if (
      d.toDateString() ===
      today.toDateString()
    ) {
      return "Today";
    } else if (
      d.toDateString() ===
      yesterday.toDateString()
    ) {
      return "Yesterday";
    } else {
      return d.toLocaleDateString();
    }
  };

  // File size formatter
  const formatFileSize = (size) => {
    const kb = size / 1024;

    if (kb < 1024)
      return `${kb.toFixed(1)} KB`;

    return `${(kb / 1024).toFixed(1)} MB`;
  };

  // Group messages
  const groupedMessages = messages.reduce(
    (groups, msg) => {
      const date = formatDate(
        msg.createdAt
      );

      if (!groups[date]) {
        groups[date] = [];
      }

      groups[date].push(msg);

      return groups;
    },
    {}
  );

  const isImage = (mimetype) =>
    mimetype?.startsWith("image/");

  const isPdf = (mimetype) =>
    mimetype === "application/pdf";

  return (
    <div className="chat-consultation-container">

      {/* HEADER */}

      <div className="chat-header">

        <div className="header-left">

          <button
            className="back-button"
            onClick={() => navigate(-1)}
          >
            ←
          </button>

          <div className="header-info">
            <h2>Patient Chat</h2>

            <span
              className={`status ${onlineStatus}`}
            >
              ● {onlineStatus}
            </span>
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
          <div className="loading">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="empty-state">

            <div className="empty-icon">
              💬
            </div>

            <p>
              No messages yet. Wait for
              patient to start the
              conversation.
            </p>

          </div>
        ) : (
          <>
            {Object.entries(
              groupedMessages
            ).map(([date, msgs]) => (
              <div key={date}>

                <div className="date-divider">
                  <span>{date}</span>
                </div>

                {msgs.map((msg) => (
                  <div
                    key={msg._id}
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
                          msg.attachment
                            .mimetype
                        ) && (
                          <img
                            src={
                              msg.attachment
                                .url
                            }
                            alt="shared"
                            className="message-image"
                          />
                        )}

                      {msg.attachment &&
                        !isImage(
                          msg.attachment
                            .mimetype
                        ) && (
                          <div className="message-file">

                            <div className="file-icon">
                              {isPdf(
                                msg.attachment
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
                                {(
                                  msg
                                    .attachment
                                    .size /
                                  1024
                                ).toFixed(
                                  2
                                )}{" "}
                                KB
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
                          {msg.message}
                        </p>
                      )}

                      <span className="message-time">
                        {formatTime(
                          msg.createdAt
                        )}
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

      {/* INCOMING VIDEO CALL MODAL */}

      {videoStatus === "pending" &&
        videoRequest && (

          <div className="incoming-call-overlay">

            <div className="incoming-call-modal">

              <div className="call-animation">
                📹
              </div>

              <h2>
                Incoming Video Consultation
              </h2>

              <p>
                Patient is requesting a
                live consultation
              </p>

              <div className="caller-info">

                <span>👤</span>

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

      {videoStatus === "accepted" && (
        <div className="video-status accepted">
          ✓ Video call accepted.
          Waiting for patient to join...
        </div>
      )}

      {videoStatus === "rejected" && (
        <div className="video-status rejected">
          ✕ Video call rejected.
        </div>
      )}

      {/* FILE PREVIEW */}

      <div className="chat-footer">

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
                    <p className="attachment-title">
                      Selected image
                    </p>

                    <p className="attachment-subtitle">
                      {selectedFile.name}
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
                    {selectedFile.name}
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

        {/* CHAT INPUT */}
        {/* VIDEO SECTION */}

        <div className="video-consultation-section">

          {videoStatus === "pending" ? (

            <button
              className="cancel-video-btn"
              onClick={handleCancelVideoRequest}
              disabled={respondingVideo}
            >
              {respondingVideo ? "⏳ Cancelling..." : "❌ Cancel Video"}
            </button>

          ) : (

            <button
              className="video-consultation-btn"
              onClick={handleVideoRequest}
              disabled={respondingVideo}
            >
              {respondingVideo ? "⏳" : "📹 Request Video Consultation"}
            </button>

          )}

          <p className="video-consultation-info">
            Start a live video consultation with your patient.
          </p>

          {videoMessage && (
            <p className="video-consultation-info video-message">
              {videoMessage}
            </p>
          )}

        </div>

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
              onClick={() =>
                fileInputRef.current?.click()
              }
              disabled={
                sending || uploading
              }
              title="Attach file"
            >
              📎
            </button>

            <input
              type="text"
              placeholder="Type a message..."
              value={input}
              onChange={(e) =>
                setInput(e.target.value)
              }
              onKeyPress={handleKeyPress}
              disabled={sending}
            />

            <button
              className="send-btn"
              onClick={handleSendMessage}
              disabled={
                sending ||
                (!input.trim() &&
                  !selectedFile)
              }
            >
              {sending ? "↻" : "→"}
            </button>

          </div>

        </div>

      </div>

    </div>
  );
};

export default DoctorChatConsultation;