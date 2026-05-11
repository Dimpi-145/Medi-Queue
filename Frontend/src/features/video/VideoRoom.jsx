import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./VideoRoom.scss";

const VideoRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="video-room-shell">
      <div className="video-room-card">
        <h1>Video Consultation Room</h1>
        <p>Your room is ready.</p>
        <div className="video-room-id">Room ID: {roomId}</div>
        <button onClick={() => navigate(-1)}>Back to history</button>
      </div>
    </div>
  );
};

export default VideoRoom;
