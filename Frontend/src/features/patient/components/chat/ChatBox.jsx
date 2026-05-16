import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import "./ChatBox.scss";

import {
  requestVideoConsultation,
  getVideoRequestStatus,
  respondToVideoRequest,
} from "../../services/video.api";

import {
  getChatHistory,
  sendChatMessage,
  sendChatMessageWithFile,
} from "../../services/chat.api";

import {
  initSocket,
  getSocket,
  joinConsultationRoom,
  leaveConsultationRoom,
  joinUserRoom,
} from "../../../../services/socket";

import {
  getChatNotificationBody,
  notifyDesktopMessage,
} from "../../../../utils/desktopNotifications";

import { resolveAttachmentUrl } from "../../../../utils/attachmentUrl";

const ChatBox = ({ chatContext, onClose }) => {
  const navigate = useNavigate();

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

  const appointmentId = chatContext?.appointmentId;

  const currentUserRole =
    chatContext?.currentUserRole ||
    (chatContext?.isDoctor ? "doctor" : "patient");

  const isDoctorView =
    chatContext?.isDoctor || currentUserRole === "doctor";

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // ================= LOAD CHAT HISTORY =================

  useEffect(() => {
    if (!appointmentId) return;

    const loadMessages = async () => {
      try {
        const res = await getChatHistory(appointmentId);

        setMessages(res.data.messages || []);
      } catch (error) {
        console.error(
          "[ChatBox] failed loading messages:",
          error
        );
      }
    };

    loadMessages();
  }, [appointmentId]);

  // ================= LOAD VIDEO STATUS =================



        setVideoRequest(
          res.data.videoRequest || null
        );

        setVideoStatus(
          res.data.videoRequest?.status ||
            null
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
    if (!appointmentId || !token) return;

    const socket =
      getSocket() || initSocket(token);

    if (!socket) return;

    joinUserRoom(userId);
    joinConsultationRoom(appointmentId);

    const handleNewMessage = (
      newMessage
    ) => {
      const incomingAppointmentId =
        String(
          newMessage.appointmentId || ""
        );
      const currentUserId = String(userId || localStorage.getItem("userId") || "");

      if (
        incomingAppointmentId !==
        String(appointmentId)
      ) {
        return;
      }

      if (String(newMessage.senderId || "") !== currentUserId) {
        void notifyDesktopMessage({
          title: newMessage.senderName || "New message",
          body: getChatNotificationBody(newMessage),
          tag: `appointment-${appointmentId}`,
        });
      }

      setMessages((prev) => {
        // Exact duplicate prevention
        const alreadyExists = prev.some(
          (msg) =>
            String(msg._id) ===
            String(newMessage._id)
        );

        if (alreadyExists) {
          return prev;
        }

        // Replace optimistic message
        const optimisticIndex =
          prev.findIndex(
            (msg) =>
              String(msg._id).startsWith(
                "local-"
              ) &&
              String(msg.senderId) ===
                String(
                  newMessage.senderId
                ) &&
              msg.message ===
                newMessage.message
          );

        if (optimisticIndex !== -1) {
          const updated = [...prev];

          updated[optimisticIndex] =
            newMessage;

          return updated;
        }

        return [...prev, newMessage];
      });
    };

    const handleVideoAccepted = (
      payload
    ) => {
      if (payload?.roomId) {
        navigate(
          `/video-room/${payload.roomId}`
        );
      }
    };

    socket.on(
      "newMessage",
      handleNewMessage
    );

    socket.on(
      "videoRequestAccepted",
      handleVideoAccepted
    );

    return () => {
      socket.off(
        "newMessage",
        handleNewMessage
      );

      socket.off(
        "videoRequestAccepted",
        handleVideoAccepted
      );

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

    if (
      file.type.startsWith("image/")
    ) {
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

  // ================= SEND MESSAGE =================

  const sendMessage = async () => {
    if (
      !input.trim() &&
      !selectedFile
    ) {
      return;
    }

    const text = input.trim();

    setInput("");
    setUploading(true);

    const tempId = `local-${Date.now()}`;

    const optimisticMessage = {
      _id: tempId,
      appointmentId,
      senderId: userId,
      senderName:
        localStorage.getItem(
          "username"
        ) || "You",
      senderRole:
        localStorage.getItem("role") ||
        currentUserRole,
      message: text,
      createdAt:
        new Date().toISOString(),
    };

    if (selectedFile) {
      optimisticMessage.attachment = {
        originalName:
          selectedFile.name,
        size: selectedFile.size,
        mimetype:
          selectedFile.type,
        url: filePreview || null,
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

        const response = await sendChatMessageWithFile(
          formData
        );

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
        const response = await sendChatMessage(
          appointmentId,
          text
        );

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
      console.error(
        "[ChatBox] send failed:",
        error
      );

      setMessages((prev) =>
        prev.filter(
          (msg) => msg._id !== tempId
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
      setUploading(false);
    }
  };

  // ================= VIDEO REQUEST =================

  const handleVideoRequest =
    async () => {
      if (!appointmentId) return;

      setVideoLoading(true);
      setVideoMessage("");

      try {
        const res =
          await requestVideoConsultation(
            appointmentId
          );

        setVideoRequest(
          res.data.videoRequest ||
            null
        );

        setVideoStatus(
          res.data.videoRequest
            ?.status || "pending"
        );

        setVideoMessage(
          "Video consultation request sent."
        );
      } catch (error) {
        const message =
          error?.response?.data
            ?.message ||
          "Unable to request video consultation.";

        setVideoMessage(message);

        console.error(
          "[ChatBox] video request failed:",
          error
        );
      } finally {
        setVideoLoading(false);
      }
    };

  // ================= VIDEO RESPONSE =================

  const handleVideoResponse =
    async (action) => {
      if (!videoRequest?._id) return;

      setActionLoading(true);

      try {
        const res =
          await respondToVideoRequest(
            videoRequest._id,
            action
          );

        const updated =
          res.data.videoRequest;

        setVideoRequest(updated);

        setVideoStatus(
          updated?.status || null
        );

        if (
          action === "accept" &&
          updated?.roomId
        ) {
          navigate(
            `/video-room/${updated.roomId}`
          );
        }
      } catch (error) {
        console.error(
          "[ChatBox] video response failed:",
          error
        );
      } finally {
        setActionLoading(false);
      }
    };

  if (!chatContext) return null;

  return (
    <div className="chat-overlay">
      <div className="chat-box">

        {/* HEADER */}

        <div className="chat-header">
          <h3>
            {chatContext.doctorName
              ? `Dr. ${chatContext.doctorName}`
              : "Consultation Chat"}
          </h3>

          <button onClick={onClose}>
            ✕
          </button>
        </div>

        {/* MESSAGES */}

        <div className="chat-messages">

          {messages.map((msg) => (
            <div
              key={msg._id}
              className={`msg ${
                msg.senderRole ===
                currentUserRole
                  ? "self"
                  : "other"
              }`}
            >

              <div className="sender-name">
                {msg.senderName ||
                  msg.senderRole}
              </div>

              {msg.attachment &&
                msg.attachment.mimetype?.startsWith(
                  "image/"
                ) && (
                  <img
                    src={resolveAttachmentUrl(msg.attachment.url)}
                    alt="shared"
                    className="message-image"
                    style={{
                      maxWidth: "200px",
                      borderRadius:
                        "8px",
                      margin:
                        "8px 0",
                    }}
                  />
                )}

              {msg.attachment &&
                !msg.attachment.mimetype?.startsWith(
                  "image/"
                ) && (
                  <div
                    className="message-file"
                    style={{
                      margin:
                        "8px 0",
                    }}
                  >

                    <div
                      style={{
                        display: "flex",
                        alignItems:
                          "center",
                        gap: "8px",
                      }}
                    >

                      <span>
                        {msg.attachment
                          .mimetype ===
                        "application/pdf"
                          ? "📄"
                          : "📎"}
                      </span>

                      <div>
                        <p
                          style={{
                            margin: 0,
                            fontSize:
                              "14px",
                            fontWeight:
                              "500",
                          }}
                        >
                          {
                            msg
                              .attachment
                              .originalName
                          }
                        </p>

                        <p
                          style={{
                            margin: 0,
                            fontSize:
                              "12px",
                            color:
                              "#666",
                          }}
                        >
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
                        href={resolveAttachmentUrl(msg.attachment.url)}
                        download
                        style={{
                          marginLeft:
                            "auto",
                        }}
                      >
                        ⬇️
                      </a>

                    </div>

                  </div>
                )}

              {msg.message && (
                <div className="message-text">
                  {msg.message}
                </div>
              )}

              <div className="message-time">
                {new Date(
                  msg.createdAt
                ).toLocaleTimeString(
                  [],
                  {
                    hour: "2-digit",
                    minute:
                      "2-digit",
                  }
                )}
              </div>

            </div>
          ))}

          <div ref={messagesEndRef} />

        </div>

        {/* VIDEO ACTIONS removed - compact video icon added to input row */}

        {/* CHAT INPUT */}

        <div className="chat-input">

          {/* FILE PREVIEW */}

          {filePreview && (
            <div
              style={{
                padding: "8px",
                backgroundColor:
                  "#f0f0f0",
                borderRadius:
                  "4px",
                marginBottom:
                  "8px",
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
              }}
            >

              <img
                src={filePreview}
                alt="preview"
                style={{
                  maxHeight: "60px",
                  borderRadius:
                    "4px",
                }}
              />

              <button
                onClick={() => {
                  setSelectedFile(
                    null
                  );

                  setFilePreview(
                    null
                  );
                }}
                style={{
                  background:
                    "none",
                  border: "none",
                  cursor:
                    "pointer",
                  fontSize:
                    "18px",
                }}
              >
                ✕
              </button>

            </div>
          )}

          {selectedFile &&
            !filePreview && (
              <div
                style={{
                  padding:
                    "8px",
                  backgroundColor:
                    "#f0f0f0",
                  borderRadius:
                    "4px",
                  marginBottom:
                    "8px",
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "center",
                }}
              >

                <span
                  style={{
                    fontSize:
                      "14px",
                  }}
                >
                  📎{" "}
                  {
                    selectedFile.name
                  }
                </span>

                <button
                  onClick={() => {
                    setSelectedFile(
                      null
                    );

                    setFilePreview(
                      null
                    );
                  }}
                  style={{
                    background:
                      "none",
                    border:
                      "none",
                    cursor:
                      "pointer",
                    fontSize:
                      "18px",
                  }}
                >
                  ✕
                </button>

              </div>
            )}

          {/* INPUT ROW */}

          <div
            style={{
              display: "flex",
              gap: "4px",
            }}
          >

            <input
              type="text"
              placeholder="Type a message..."
              value={input}
              onChange={(e) =>
                setInput(
                  e.target.value
                )
              }
              onKeyDown={(e) => {
                if (
                  e.key ===
                  "Enter"
                ) {
                  sendMessage();
                }
              }}
              style={{
                flex: 1,
              }}
            />

            <button
              onClick={() =>
                fileInputRef.current?.click()
              }
              title="Attach file"
              style={{
                padding:
                  "8px 12px",
                background:
                  "#f0f0f0",
                border: "none",
                borderRadius:
                  "4px",
                cursor:
                  "pointer",
              }}
            >
              📎
            </button>

            <button
              onClick={handleVideoRequest}
              title="Request video consultation"
              disabled={
                videoLoading ||
                videoStatus === "pending" ||
                videoStatus === "accepted" ||
                isDoctorView
              }
              style={{
                padding: "8px 12px",
                background: "#f0f0f0",
                border: "none",
                borderRadius: "4px",
                cursor:
                  videoLoading || isDoctorView
                    ? "not-allowed"
                    : "pointer",
                marginLeft: "4px",
              }}
            >
              📹
            </button>

            <button
              onClick={
                sendMessage
              }
              disabled={
                uploading ||
                (!input.trim() &&
                  !selectedFile)
              }
              style={{
                padding:
                  "8px 16px",
                background:
                  uploading
                    ? "#ccc"
                    : "#007bff",
                color: "white",
                border: "none",
                borderRadius:
                  "4px",
                cursor:
                  uploading
                    ? "wait"
                    : "pointer",
              }}
            >
              {uploading
                ? "Sending..."
                : "Send"}
            </button>

          </div>

          <input
            ref={fileInputRef}
            type="file"
            onChange={
              handleFileSelect
            }
            style={{
              display: "none",
            }}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          />

        </div>

      </div>
    </div>
  );
};

export default ChatBox;