import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";

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

  const [videoLoading, setVideoLoading] = useState(false);

  const [onlineStatus, setOnlineStatus] = useState("offline");

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

        console.error(
          "Failed to load chat history:",
          error
        );

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

        const res =
          await getVideoRequestStatus(
            appointmentId
          );

        setVideoStatus(
          res.data.videoRequest?.status ||
            null
        );

      } catch (error) {

        setVideoStatus(null);

      }
    };

    loadVideoStatus();

  }, [appointmentId]);

  // Socket connection

  useEffect(() => {

    if (!appointmentId) return;

    const socket = io(
      "http://localhost:3000"
    );

    socketRef.current = socket;

    socket.on("connect", () => {

      const userIdFromStorage =
        localStorage.getItem("userId");

      if (userIdFromStorage) {

        userId.current =
          userIdFromStorage;

        socket.emit(
          "joinUserRoom",
          userIdFromStorage
        );
      }

      socket.emit(
        "joinConsultationRoom",
        `consultation-${appointmentId}`
      );

      setOnlineStatus("online");
    });

    // New messages
    socket.on("newMessage", (newMessage) => {
      const msgApptId = String(newMessage.appointmentId || "");
      const msgConsultId = String(newMessage.consultationId || "");
      const currentId = String(appointmentId);

      if (msgApptId !== currentId && msgConsultId !== currentId) return;

      setMessages((prev) => {
        // Exact-match dedupe by _id
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
    });

    // Video accepted

    socket.on(
      "videoRequestAccepted",
      (payload) => {

        if (payload.roomId) {

          navigate(
            `/video-room/${payload.roomId}`
          );
        }
      }
    );

    // Video request received (doctor initiated)
    socket.on("videoRequestReceived", (payload) => {
      if (payload.appointmentId === appointmentId) {
        setVideoRequest({
          _id: payload.videoRequestId,
          appointmentId: payload.appointmentId,
          status: "pending",
          doctorName: payload.doctorName || "Doctor",
          initiator: payload.initiator,
        });

        setVideoStatus("pending");
      }
    });

    // Video rejected

    socket.on(
      "videoRequestRejected",
      () => {

        setVideoStatus("rejected");

        setVideoMessage(
          "Doctor declined your video request."
        );
      }
    );

    // Video cancelled

    socket.on("videoRequestCancelled", (payload) => {
      setVideoStatus(null);
      setVideoRequest(null);
      setVideoMessage("Video request cancelled.");
    });

    // Video call ended
    socket.on("videoCallEnded", (payload) => {
      setVideoStatus(null);
      setVideoRequest(null);
      setVideoMessage("Video call ended.");
    });

    socket.on("disconnect", () => {

      setOnlineStatus("offline");
    });

    return () => {

      socket.emit(
        "leaveUserRoom",
        userId.current
      );

      socket.emit(
        "leaveConsultationRoom",
        `consultation-${appointmentId}`
      );

      socket.disconnect();
    };

  }, [appointmentId, navigate]);

  // File select

  const handleFileSelect = (e) => {

    const file = e.target.files?.[0];

    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {

      alert(
        "File size must be less than 10MB"
      );

      return;
    }

    setSelectedFile(file);

    if (file.type.startsWith("image/")) {

      const reader = new FileReader();

      reader.onload = (event) => {

        setFilePreview(
          event.target.result
        );
      };

      reader.readAsDataURL(file);

    } else {

      setFilePreview(null);

    }
  };

  // Send message

  const handleSendMessage = async () => {

    if (
      !input.trim() &&
      !selectedFile
    )
      return;

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
          await sendChatMessageWithFile(formData);

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

        await sendChatMessage(appointmentId, text);
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

  const handleVideoRequest =
    async () => {

      if (!appointmentId) return;

      setVideoLoading(true);

      setVideoMessage("");

      try {

        await requestVideoConsultation(
          appointmentId
        );

        // FORCE pending state

        setVideoStatus("pending");

        setVideoMessage(
          "Video consultation request sent successfully."
        );

      } catch (error) {

        console.error(
          "Failed to request video:",
          error
        );

        // If backend says already pending,
        // still show cancel button

        if (
          error.response?.data?.message?.includes(
            "already pending"
          )
        ) {

          setVideoStatus("pending");

        }

        setVideoMessage(
          error.response?.data
            ?.message ||
            "Unable to send video request."
        );

      } finally {

        setVideoLoading(false);

      }
    };

  // Cancel request

  const handleCancelVideoRequest =
    async () => {

      if (!appointmentId) return;

      setVideoLoading(true);

      try {

        await cancelVideoConsultation(
          appointmentId
        );

        setVideoStatus(null);

        setVideoMessage(
          "Video consultation request cancelled."
        );

      } catch (error) {

        console.error(
          "Failed to cancel request:",
          error
        );

        setVideoMessage(
          "Unable to cancel request."
        );

      } finally {

        setVideoLoading(false);

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

    return new Date(date).toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // Format date

  const formatDate = (date) => {

    const d = new Date(date);

    const today = new Date();

    const yesterday =
      new Date(today);

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

  // Group messages

  const groupedMessages =
    messages.reduce(
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
              Doctor Consultation
            </h2>

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
            onClick={() =>
              navigate(-1)
            }
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
              No messages yet.
              Start the conversation!
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
                      "patient"
                        ? "sent"
                        : "received"
                    }`}
                  >

                    <div className="message-bubble">

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

      {/* FOOTER */}

      <div className="chat-footer">

        {videoStatus === "pending" && videoRequest && videoRequest.initiator === "doctor" && (
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
                <button className="accept-btn" onClick={() => handleVideoResponse("accept")} disabled={videoLoading}>
                  {videoLoading ? "Processing..." : "Accept"}
                </button>
                <button className="reject-btn" onClick={() => handleVideoResponse("reject")} disabled={videoLoading}>
                  {videoLoading ? "Processing..." : "Reject"}
                </button>
              </div>
            </div>
          </div>
        )}

        {videoStatus === "pending" && !(videoRequest && videoRequest.initiator === "doctor") && (
          <div className="video-status pending">
            ⏳ Video request sent. Waiting for doctor to accept...
          </div>
        )}

        {videoStatus ===
          "rejected" && (
          <div className="video-status rejected">
            ❌ Doctor declined the
            video consultation request.
          </div>
        )}

        {/* VIDEO SECTION */}

        <div className="video-consultation-section">

          {videoStatus ===
          "pending" ? (

            <button
              className="cancel-video-btn"
              onClick={
                handleCancelVideoRequest
              }
              disabled={videoLoading}
            >

              {videoLoading
                ? "⏳ Cancelling..."
                : "❌ Cancel Video Request"}

            </button>

          ) : (

            <button
              className="video-consultation-btn"
              onClick={
                handleVideoRequest
              }
              disabled={
                videoLoading
              }
            >

              {videoLoading ? (
                <>
                  ⏳ Sending Request...
                </>
              ) : (
                <>
                  📹 Request Video Consultation
                </>
              )}

            </button>

          )}

          <p className="video-consultation-info">
            Request a live video
            consultation with your
            doctor.
          </p>

          {videoMessage && (
            <p className="video-consultation-info video-message">
              {videoMessage}
            </p>
          )}

        </div>

        {/* INPUT */}

        <div className="chat-input-area">

          <input
            ref={fileInputRef}
            type="file"
            onChange={
              handleFileSelect
            }
            style={{
              display: "none",
            }}
          />

          <div className="input-wrapper">

            <button
              className="attach-btn"
              onClick={() =>
                fileInputRef.current?.click()
              }
            >
              📎
            </button>

            <input
              type="text"
              placeholder="Type a message..."
              value={input}
              onChange={(e) =>
                setInput(
                  e.target.value
                )
              }
              onKeyPress={
                handleKeyPress
              }
            />

            <button
              className="send-btn"
              onClick={
                handleSendMessage
              }
            >
              →
            </button>

          </div>

        </div>

      </div>

    </div>
  );
};

export default ChatConsultation;