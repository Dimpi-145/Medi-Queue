import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import {
  getChatHistory,
  sendChatMessage,
} from "../services/chat.api";
import {
  requestVideoConsultation,
  getVideoRequestStatus,
} from "../services/video.api";
import "../styles/ChatConsultation.scss";

const ChatConsultation = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [videoStatus, setVideoStatus] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState("offline");
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const userId = useRef(null);
  const fileInputRef = useRef(null);

  // Scroll to latest message
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load chat history on mount
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

  // Setup Socket.IO connection
  useEffect(() => {
    if (!appointmentId) return;

    // Create single socket connection
    const socket = io("http://localhost:3000");
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to socket server");
      // Join user room and consultation room
      const userIdFromStorage = localStorage.getItem("userId");
      if (userIdFromStorage) {
        userId.current = userIdFromStorage;
        socket.emit("joinUserRoom", userIdFromStorage);
      }
      socket.emit("joinConsultationRoom", `consultation-${appointmentId}`);
      setOnlineStatus("online");
    });

    // Listen for new messages
    socket.on("newMessage", (newMessage) => {
      if (newMessage.appointmentId === appointmentId || newMessage.consultationId === appointmentId) {
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some((msg) => msg._id === newMessage._id)) {
            return prev;
          }
          return [...prev, newMessage];
        });
      }
    });

    // Listen for video acceptance
    socket.on("videoRequestAccepted", (payload) => {
      if (payload.roomId) {
        navigate(`/video-room/${payload.roomId}`);
      }
    });

    // Listen for video rejection
    socket.on("videoRequestRejected", (payload) => {
      setVideoStatus("rejected");
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from socket server");
      setOnlineStatus("offline");
    });

    return () => {
      socket.emit("leaveUserRoom", userId.current);
      socket.emit("leaveConsultationRoom", `consultation-${appointmentId}`);
      socket.disconnect();
    };
  }, [appointmentId, navigate]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    setSelectedFile(file);

    // Show preview for images
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

  const handleSendMessage = async () => {
    if (!input.trim() && !selectedFile) return;

    const text = input.trim();
    setInput("");
    setSending(true);

    try {
      if (selectedFile) {
        // Send with file
        const formData = new FormData();
        formData.append("appointmentId", appointmentId);
        formData.append("message", text);
        formData.append("file", selectedFile);

        console.log("[Chat] Sending file:", selectedFile.name);
        const response = await fetch("http://localhost:3000/api/chat/send-with-file", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        });

        const responseData = await response.json();
        
        if (!response.ok) {
          throw new Error(responseData.message || "Failed to send file");
        }

        console.log("[Chat] File sent successfully:", responseData);
        setSelectedFile(null);
        setFilePreview(null);
      } else {
        await sendChatMessage(appointmentId, text);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message: " + error.message);
      setInput(text); // Restore input on failure
    } finally {
      setSending(false);
    }
  };

  const handleVideoRequest = async () => {
    setVideoLoading(true);
    try {
      const res = await requestVideoConsultation(appointmentId);
      setVideoStatus("pending");
    } catch (error) {
      console.error("Failed to request video:", error);
    } finally {
      setVideoLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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
    } else if (d.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return d.toLocaleDateString();
    }
  };

  const formatFileSize = (size) => {
    const kb = size / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    const date = formatDate(msg.createdAt);
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  const isImage = (mimetype) => mimetype?.startsWith("image/");
  const isPdf = (mimetype) => mimetype === "application/pdf";

  return (
    <div className="chat-consultation-container">
      {/* Header */}
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
          {videoStatus !== "accepted" && (
            <button
              className="video-btn"
              onClick={handleVideoRequest}
              disabled={videoLoading || videoStatus === "pending"}
              title="Request Video Consultation"
            >
              📹
            </button>
          )}
          <button
            className="close-btn"
            onClick={() => navigate(-1)}
            title="Close Chat"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Messages Container */}
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
                    className={`message-wrapper ${
                      msg.senderRole === "patient" ? "sent" : "received"
                    }`}
                  >
                    <div className="message-bubble">
                      {msg.attachment && isImage(msg.attachment.mimetype) && (
                        <img
                          src={msg.attachment.url}
                          alt="shared"
                          className="message-image"
                        />
                      )}
                      {msg.attachment && !isImage(msg.attachment.mimetype) && (
                        <div className="message-file">
                          <div className="file-icon">
                            {isPdf(msg.attachment.mimetype) ? "📄" : "📎"}
                          </div>
                          <div className="file-info">
                            <p className="file-name">{msg.attachment.originalName}</p>
                            <p className="file-size">
                              {(msg.attachment.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                          <a href={msg.attachment.url} download className="download-btn">
                            ⬇️
                          </a>
                        </div>
                      )}
                      {msg.message && <p className="message-text">{msg.message}</p>}
                      <span className="message-time">{formatTime(msg.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Video Status Info */}
      {videoStatus === "pending" && (
        <div className="video-status pending">
          ⏳ Video request sent. Waiting for doctor to accept...
        </div>
      )}
      {videoStatus === "rejected" && (
        <div className="video-status rejected">
          ❌ Doctor declined the video consultation request.
        </div>
      )}

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
                    <p className="attachment-title">Selected image</p>
                    <p className="attachment-subtitle">{selectedFile.name}</p>
                  </div>
                  <button
                    className="remove-preview"
                    onClick={() => {
                      setSelectedFile(null);
                      setFilePreview(null);
                    }}
                    aria-label="Remove attachment"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <div className="attachment-file-card">
                <div className="attachment-file-icon">{selectedFile.type === "application/pdf" ? "📄" : "📎"}</div>
                <div className="attachment-file-info">
                  <p className="attachment-title">{selectedFile.name}</p>
                  <p className="attachment-subtitle">{formatFileSize(selectedFile.size)}</p>
                </div>
                <button
                  className="remove-preview"
                  onClick={() => {
                    setSelectedFile(null);
                    setFilePreview(null);
                  }}
                  aria-label="Remove attachment"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        )}

        {/* Input Area */}
        <div className="chat-input-area">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          style={{ display: "none" }}
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
  );
};

export default ChatConsultation;
