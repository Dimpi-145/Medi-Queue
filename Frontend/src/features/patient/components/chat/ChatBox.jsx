import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import "./ChatBox.scss";
import {
  requestVideoConsultation,
  getVideoRequestStatus,
  respondToVideoRequest,
} from "../../services/video.api";
import { getChatHistory, sendChatMessage } from "../../services/chat.api";

const ChatBox = ({ chatContext, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [videoRequest, setVideoRequest] = useState(null);
  const [videoStatus, setVideoStatus] = useState(null);
  const [videoMessage, setVideoMessage] = useState("");
  const [videoLoading, setVideoLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const messagesEndRef = useRef(null);
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
      socketClient.emit(
        "joinConsultationRoom",
        `consultation-${chatContext.appointmentId}`
      );
    });

    const handleNewMessage = (newMessage) => {
      if (newMessage.consultationId !== chatContext.appointmentId) return;

      setMessages((prev) => {
        if (prev.some((msg) => msg._id === newMessage._id)) {
          return prev;
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

  const sendMessage = async () => {
    if (!input.trim()) return;

    const text = input.trim();
    setInput("");

    try {
      await sendChatMessage(chatContext.appointmentId, text);
      // Message will be added via socket event listener
    } catch (error) {
      console.error("Send message failed", error);
      setInput(text); // Restore input on failure
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
              <div className="message-text">{msg.message}</div>
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
          <input
            type="text"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;