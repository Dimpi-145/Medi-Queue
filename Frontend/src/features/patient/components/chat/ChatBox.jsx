import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import "./ChatBox.scss";
import {
  requestVideoConsultation,
  getVideoRequestStatus,
  respondToVideoRequest,
} from "../../services/video.api";
import { getChatHistory, sendChatMessage, sendChatMessageWithFile } from "../../services/chat.api";

const ChatBox = ({ chatContext, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [videoRequest, setVideoRequest] = useState(null);
  const [videoStatus, setVideoStatus] = useState(null);
  const [videoMessage, setVideoMessage] = useState("");
  const [videoLoading, setVideoLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const currentUserRole =
    chatContext?.currentUserRole || (chatContext?.isDoctor ? "doctor" : "patient");
  const contactName =
    chatContext?.contactName || chatContext?.doctorName || chatContext?.patientName || "Chat";
  const isDoctorView = currentUserRole === "doctor";

  useEffect(() => {
    if (!chatContext?.appointmentId) return;

    const fetchMessages = async () => {
      try {
        const res = await getChatHistory(chatContext.appointmentId);
        setMessages(res.data.messages || []);
      } catch (error) {
        console.error("Failed to load chat history", error);
      }
    };

    fetchMessages();
  }, [chatContext]);

  useEffect(() => {
    if (!chatContext?.appointmentId) return;

    const loadVideoRequest = async () => {
      try {
        const res = await getVideoRequestStatus(chatContext.appointmentId);
        setVideoRequest(res.data.videoRequest || null);
        setVideoStatus(res.data.videoRequest?.status || null);
      } catch (error) {
        setVideoRequest(null);
        setVideoStatus(null);
      }
    };

    loadVideoRequest();
  }, [chatContext]);

  useEffect(() => {
    if (!chatContext?.appointmentId) return;

    const socketClient = io("http://localhost:3000");

    socketClient.on("connect", () => {
      // Join user room for direct messaging
      const userIdFromStorage = localStorage.getItem("userId");
      if (userIdFromStorage) {
        socketClient.emit("joinUserRoom", userIdFromStorage);
        console.log("[Socket] Joined user room:", userIdFromStorage);
      }
      
      // Join consultation room for this chat
      socketClient.emit(
        "joinConsultationRoom",
        `consultation-${chatContext.appointmentId}`
      );
      console.log("[Socket] Joined consultation room:", `consultation-${chatContext.appointmentId}`);
    });

    const handleNewMessage = (newMessage) => {
      const msgAppointmentId = String(newMessage.appointmentId || newMessage.consultationId || "");
      const currentAppointmentId = String(chatContext.appointmentId || "");

      if (msgAppointmentId !== currentAppointmentId) return;

      setMessages((prev) => {
        // Exact-match dedupe
        if (prev.some((msg) => String(msg._id) === String(newMessage._id))) {
          return prev;
        }

        // Replace optimistic local message if matching (same sender, text, within 10s)
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
    };

    const handleVideoAccepted = (payload) => {
      if (payload.roomId) {
        navigate(`/video-room/${payload.roomId}`);
      }
    };

    socketClient.on("newMessage", handleNewMessage);
    socketClient.on("videoRequestAccepted", handleVideoAccepted);

    return () => {
      socketClient.off("newMessage", handleNewMessage);
      socketClient.off("videoRequestAccepted", handleVideoAccepted);
      socketClient.emit(
        "leaveConsultationRoom",
        `consultation-${chatContext.appointmentId}`
      );
      socketClient.disconnect();
    };
  }, [chatContext, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!chatContext) return null;

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

  const sendMessage = async () => {
    if (!input.trim() && !selectedFile) return;

    const text = input.trim();
    setInput("");
    setUploading(true);

    try {
      if (selectedFile) {
        const tempId = `local-${Date.now()}`;

        const optimistic = {
          _id: tempId,
          appointmentId: chatContext.appointmentId,
          consultationId: chatContext.appointmentId,
          senderId: localStorage.getItem("userId"),
          senderName: localStorage.getItem("username") || "You",
          receiverId: null,
          receiverName: "",
          senderRole: localStorage.getItem("role") || (chatContext?.isDoctor ? "doctor" : "patient"),
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
        formData.append("appointmentId", chatContext.appointmentId);
        formData.append("message", text);
        formData.append("file", selectedFile);

        await sendChatMessageWithFile(formData);

        setSelectedFile(null);
        setFilePreview(null);
      } else {
        await sendChatMessage(chatContext.appointmentId, text);
      }
      // Message will be added via socket event listener
    } catch (error) {
      console.error("Send message failed", error);
      setInput(text); // Restore input on failure
      const serverMsg = error?.response?.data?.message;
      alert("Failed to send message: " + (serverMsg || error.message));
    } finally {
      setUploading(false);
    }
  };

  const handleVideoRequest = async () => {
    if (!chatContext?.appointmentId) return;

    setVideoLoading(true);
    setVideoMessage("");

    try {
      const res = await requestVideoConsultation(chatContext.appointmentId);
      setVideoRequest(res.data.videoRequest || null);
      setVideoStatus(res.data.videoRequest?.status || "pending");
      setVideoMessage("Video consultation request sent to the doctor.");
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Unable to send video consultation request.";
      setVideoMessage(errorMessage);
      console.error("Video request failed", error);
    } finally {
      setVideoLoading(false);
    }
  };

  const handleVideoResponse = async (action) => {
    if (!videoRequest?._id) return;

    setActionLoading(true);
    setVideoMessage("");

    try {
      const res = await respondToVideoRequest(videoRequest._id, action);
      setVideoRequest(res.data.videoRequest || null);
      setVideoStatus(
        res.data.videoRequest?.status ||
          (action === "accept" ? "accepted" : "rejected")
      );
      if (action === "accept") {
        const roomId = res.data.videoRequest?.roomId;
        if (roomId) navigate(`/video-room/${roomId}`);
      }
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Unable to respond to video request.";
      setVideoMessage(message);
      console.error("Video response failed", error);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="chat-overlay">
      <div className="chat-box">
        <div className="chat-header">
          <h3>Dr. {chatContext.doctorName}</h3>
          <button onClick={onClose}>✕</button>
        </div>

        <div className="chat-messages">
          {messages.map((msg) => (
            <div
              key={msg._id}
              className={`msg ${msg.senderRole === currentUserRole ? "self" : "other"}`}
            >
              <div className="sender-name">{msg.senderName || msg.senderRole}</div>
              {msg.attachment && msg.attachment.mimetype?.startsWith("image/") && (
                <img
                  src={msg.attachment.url}
                  alt="shared"
                  className="message-image"
                  style={{ maxWidth: "200px", borderRadius: "8px", margin: "8px 0" }}
                />
              )}
              {msg.attachment && !msg.attachment.mimetype?.startsWith("image/") && (
                <div className="message-file" style={{ margin: "8px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>{msg.attachment.mimetype === "application/pdf" ? "📄" : "📎"}</span>
                    <div>
                      <p style={{ margin: "0", fontSize: "14px", fontWeight: "500" }}>
                        {msg.attachment.originalName}
                      </p>
                      <p style={{ margin: "0", fontSize: "12px", color: "#666" }}>
                        {(msg.attachment.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <a href={msg.attachment.url} download style={{ marginLeft: "auto" }}>
                      ⬇️
                    </a>
                  </div>
                </div>
              )}
              {msg.message && <div className="message-text">{msg.message}</div>}
              <div className="message-time">
                {new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-actions">
          {isDoctorView ? (
            videoRequest?.status === "pending" ? (
              <>
                <button
                  className="video-request-button"
                  onClick={() => handleVideoResponse("accept")}
                  disabled={actionLoading}
                >
                  Accept Video Request
                </button>
                <button
                  className="video-request-button reject"
                  onClick={() => handleVideoResponse("reject")}
                  disabled={actionLoading}
                >
                  Reject Video Request
                </button>
              </>
            ) : (
              <div className="video-request-note">
                {videoStatus === "accepted"
                  ? "Video consultation accepted."
                  : videoStatus === "rejected"
                  ? "Video consultation rejected."
                  : "No active video request."}
              </div>
            )
          ) : (
            <>
              <button
                className="video-request-button"
                onClick={handleVideoRequest}
                disabled={
                  videoLoading ||
                  videoStatus === "pending" ||
                  videoStatus === "accepted"
                }
              >
                {videoStatus === "pending"
                  ? "Video Request Pending"
                  : videoStatus === "accepted"
                  ? "Video Request Accepted"
                  : "Request Video Consultation"}
              </button>
              {videoMessage && (
                <p className="video-request-note">{videoMessage}</p>
              )}
            </>
          )}
        </div>

        <div className="chat-input">
          {filePreview && (
            <div style={{
              padding: "8px",
              backgroundColor: "#f0f0f0",
              borderRadius: "4px",
              marginBottom: "8px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <img src={filePreview} alt="preview" style={{ maxHeight: "60px", borderRadius: "4px" }} />
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setFilePreview(null);
                }}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px" }}
              >
                ✕
              </button>
            </div>
          )}
          {selectedFile && !filePreview && (
            <div style={{
              padding: "8px",
              backgroundColor: "#f0f0f0",
              borderRadius: "4px",
              marginBottom: "8px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <span style={{ fontSize: "14px" }}>📎 {selectedFile.name}</span>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setFilePreview(null);
                }}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px" }}
              >
                ✕
              </button>
            </div>
          )}
          <div style={{ display: "flex", gap: "4px" }}>
            <input
              type="text"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              style={{ flex: 1 }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Attach file"
              style={{
                padding: "8px 12px",
                background: "#f0f0f0",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              📎
            </button>
            <button
              onClick={sendMessage}
              disabled={uploading || (!input.trim() && !selectedFile)}
              style={{
                padding: "8px 16px",
                background: uploading ? "#ccc" : "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: uploading ? "wait" : "pointer"
              }}
            >
              {uploading ? "Sending..." : "Send"}
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            style={{ display: "none" }}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          />
        </div>
      </div>
    </div>
  );
};

export default ChatBox;