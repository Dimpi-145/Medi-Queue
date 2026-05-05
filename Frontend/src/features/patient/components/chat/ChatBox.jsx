import React, { useState } from "react";
import "./ChatBox.scss";

const ChatBox = ({ chatContext, onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "doctor",
      text: "Hello! How can I help you?",
    },
  ]);

  const [input, setInput] = useState("");

  if (!chatContext) return null;

  const sendMessage = () => {
    if (!input.trim()) return;

    const newMessage = {
      id: Date.now(),
      sender: "patient",
      text: input,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");
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
            <div key={msg.id} className={`msg ${msg.sender}`}>
              {msg.text}
            </div>
          ))}
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