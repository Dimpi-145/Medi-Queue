import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import { initSocket } from "../../services/socket";
import "./VideoRoom.scss";

const VideoRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  
  // Video references
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  
  // WebRTC
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  
  // Socket
  const socketRef = useRef(null);
  const userIdRef = useRef(null);
  const offerSentRef = useRef(false);
  
  // State
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState(null);
  const [remoteUserConnected, setRemoteUserConnected] = useState(false);

  const RTCConfig = {
    iceServers: (() => {
      const list = [];
      const stun = import.meta.env.VITE_STUN_URL || "stun:stun.l.google.com:19302";
      const turn = import.meta.env.VITE_TURN_URL || "";
      if (stun) list.push({ urls: stun });
      if (turn) {
        const username = import.meta.env.VITE_TURN_USERNAME || undefined;
        const credential = import.meta.env.VITE_TURN_PASSWORD || undefined;
        list.push({ urls: turn, username, credential });
      }
      return list;
    })(),
  };

  // Initialize WebRTC Connection
  const initializePeerConnection = useCallback(async () => {
    try {
      setError(null);
      console.log("[WebRTC] Starting peer connection initialization...");

      // Request camera/microphone with fallback if exact constraints fail
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: { 
            echoCancellation: true, 
            noiseSuppression: true,
            autoGainControl: true 
          },
        });
        console.log("[WebRTC] Got media stream with HD constraints");
      } catch (err) {
        console.warn("[WebRTC] HD constraints failed, retrying with standard...", err.message);
        // Fallback to standard constraints
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        console.log("[WebRTC] Got media stream with standard constraints");
      }

      if (!stream) {
        throw new Error("Failed to get media stream");
      }

      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        console.log("[WebRTC] Local video element updated with stream");
      }

      // Create peer connection
      const peerConnection = new RTCPeerConnection({ iceServers: RTCConfig.iceServers });
      peerConnectionRef.current = peerConnection;
      console.log("[WebRTC] RTCPeerConnection created");

      // candidate queue to handle early ICE candidates
      peerConnection._pendingCandidates = [];

      // Add local tracks to peer connection
      let trackCount = 0;
      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
        trackCount++;
        console.log("[WebRTC] Added track:", track.kind, "enabled:", track.enabled);
      });
      console.log("[WebRTC] Total tracks added:", trackCount);

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        console.log("[WebRTC] Received remote track:", event.track.kind, "streams:", event.streams.length);
        
        if (!remoteStreamRef.current) {
          remoteStreamRef.current = new MediaStream();
          console.log("[WebRTC] Created new MediaStream for remote");
        }
        
        remoteStreamRef.current.addTrack(event.track);
        console.log("[WebRTC] Added remote track to stream, total tracks:", remoteStreamRef.current.getTracks().length);
        
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStreamRef.current;
          console.log("[WebRTC] Remote video element updated");
        }
        
        setRemoteUserConnected(true);
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("[WebRTC] Generated ICE candidate:", event.candidate.candidate.substring(0, 50) + "...");
          if (socketRef.current) {
            socketRef.current.emit("sendIceCandidate", {
              roomId,
              candidate: event.candidate,
              from: userIdRef.current,
            });
          }
        } else {
          console.log("[WebRTC] ICE candidate generation completed (null candidate)");
        }
      };

      // drain pending candidates if any
      if (peerConnection._pendingCandidates && peerConnection._pendingCandidates.length) {
        peerConnection._pendingCandidates.forEach((c) => {
          try { peerConnection.addIceCandidate(c); } catch (e) { console.warn('[WebRTC] addIceCandidate drain failed', e); }
        });
        peerConnection._pendingCandidates = [];
      }

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log("[WebRTC] Connection state:", peerConnection.connectionState);
        
        if (peerConnection.connectionState === "failed") {
          console.error("[WebRTC] Connection failed - attempting recovery");
          setError("Connection failed. Please try again.");
        } else if (peerConnection.connectionState === "disconnected") {
          console.warn("[WebRTC] Connection disconnected");
          setError("Connection lost. Ending call...");
          setTimeout(() => handleHangUp(), 2000);
        } else if (peerConnection.connectionState === "connected") {
          console.log("[WebRTC] Connection successfully established!");
          setError(null);
        }
      };

      // Handle ICE connection state changes
      peerConnection.oniceconnectionstatechange = () => {
        console.log("[WebRTC] ICE Connection state:", peerConnection.iceConnectionState);
        
        if (peerConnection.iceConnectionState === "failed") {
          console.warn("[WebRTC] ICE connection failed");
        } else if (peerConnection.iceConnectionState === "connected" || peerConnection.iceConnectionState === "completed") {
          console.log("[WebRTC] ICE connection established");
        }
      };

      // Handle signaling state changes
      peerConnection.onsignalingstatechange = () => {
        console.log("[WebRTC] Signaling state:", peerConnection.signalingState);
      };

      setConnected(true);
      setConnecting(false);
      setError(null);
      console.log("[WebRTC] Peer connection ready, waiting for socket...");

      // Join video room without creating an offer yet.
      if (socketRef.current) {
        console.log("[WebRTC] Joining video room:", roomId);
        socketRef.current.emit("joinVideoRoom", { roomId, userId: userIdRef.current });
      } else {
        console.error("[WebRTC] Socket not available for room join");
      }
    } catch (err) {
      console.error("[WebRTC] Error initializing peer connection:", err);
      
      // Provide specific error messages
      let errorMsg = err.message;
      if (err.name === "NotAllowedError") {
        errorMsg = "Camera/Microphone access denied. Please check permissions.";
      } else if (err.name === "NotFoundError") {
        errorMsg = "No camera or microphone found on this device.";
      } else if (err.name === "NotReadableError") {
        errorMsg = "Camera/Microphone already in use by another application.";
      }
      
      setError(errorMsg);
      setConnecting(false);
    }
  }, [roomId]);

  // Setup Socket.IO connection
  useEffect(() => {
    if (!roomId) return;

    const token = localStorage.getItem("token");
    const socket = initSocket(token);
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to socket server");
      const userId = localStorage.getItem("userId");
      userIdRef.current = userId;
      // Initialize peer connection after socket connection
      initializePeerConnection();
    });

    // Receive offer from remote peer
    socket.on("receiveOffer", async (data) => {
      const { offer, from } = data;
      console.log("[Socket] Received offer from:", from);
      
      try {
        if (!peerConnectionRef.current) {
          console.log("[Socket] No peer connection, initializing...");
          await initializePeerConnection();
        }

        if (!peerConnectionRef.current) {
          throw new Error("Failed to create peer connection");
        }

        console.log("[WebRTC] Setting remote description (offer)");
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        console.log("[WebRTC] Remote description set, creating answer...");
        
        const answer = await peerConnectionRef.current.createAnswer();
        console.log("[WebRTC] Answer created, setting local description...");
        await peerConnectionRef.current.setLocalDescription(answer);
        
        console.log("[Socket] Sending answer back to peer");
        socket.emit("sendAnswer", {
          roomId,
          answer,
          from: userIdRef.current,
        });
      } catch (err) {
        console.error("[WebRTC] Error handling offer:", err);
        setError(`Error processing offer: ${err.message}`);
      }
    });

    // Receive answer from remote peer
    socket.on("receiveAnswer", async (data) => {
      const { answer, from } = data;
      console.log("[Socket] Received answer from:", from);
      
      try {
        if (!peerConnectionRef.current) {
          console.error("[WebRTC] No peer connection to set answer on");
          return;
        }

        console.log("[WebRTC] Current signaling state:", peerConnectionRef.current.signalingState);
        
        if (peerConnectionRef.current.signalingState === "stable") {
          console.warn("[WebRTC] Signaling state is stable, cannot set answer");
          return;
        }

        console.log("[WebRTC] Setting remote description (answer)");
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        console.log("[WebRTC] Answer processed successfully");
      } catch (err) {
        console.error("[WebRTC] Error handling answer:", err);
        setError(`Error processing answer: ${err.message}`);
      }
    });

    // Receive ICE candidate
    socket.on("receiveIceCandidate", async (data) => {
      const { candidate, from } = data;
      console.log("[Socket] Received ICE candidate from:", from);
      
      try {
        if (!peerConnectionRef.current) {
          console.error("[WebRTC] No peer connection to add ICE candidate");
          return;
        }

        if (!candidate) {
          console.log("[WebRTC] Null ICE candidate received (EOC)");
          return;
        }

        console.log("[WebRTC] Adding ICE candidate...");
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        console.log("[WebRTC] ICE candidate added successfully");
      } catch (err) {
        console.warn("[WebRTC] Error adding ICE candidate:", err.message);
      }
    });

    // Listen for remote user joining
    socket.on("userJoinedVideo", async (data) => {
      console.log("[Socket] Remote user joined video room:", data.userId);
      
      if (!peerConnectionRef.current) {
        console.warn("[WebRTC] Received userJoinedVideo before peer connection created");
        return;
      }

      if (data.userId === userIdRef.current) {
        console.log("[WebRTC] Ignoring own join event");
        return;
      }

      if (!offerSentRef.current) {
        try {
          console.log("[WebRTC] Creating offer because remote user joined");
          const offer = await peerConnectionRef.current.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          });

          await peerConnectionRef.current.setLocalDescription(offer);
          socket.emit("sendOffer", {
            roomId,
            offer,
            from: userIdRef.current,
          });
          offerSentRef.current = true;
          console.log("[WebRTC] Offer sent after remote join");
        } catch (err) {
          console.error("[WebRTC] Error creating/sending offer after remote joined:", err);
          setError(`Signaling error: ${err.message}`);
        }
      }
    });

    socket.on("error", (error) => {
      console.error("[Socket] Socket error:", error);
      setError(`Connection error: ${error}`);
    });

    socket.on("disconnect", () => {
      console.log("[Socket] Disconnected from socket server");
      if (peerConnectionRef.current?.connectionState === "connected" || 
          peerConnectionRef.current?.connectionState === "connecting") {
        console.log("[WebRTC] Peer connection active but socket disconnected, ending call");
        handleHangUp();
      }
    });

    socket.on("connect_error", (err) => {
      console.error("[Socket] Connection error:", err);
      setError(`Socket connection failed: ${err.message}`);
      setConnecting(false);
    });

    return () => {
      console.log("[Socket] Cleaning up socket listeners");
      socket.off("receiveOffer");
      socket.off("receiveAnswer");
      socket.off("receiveIceCandidate");
      socket.off("userJoinedVideo");
      socket.off("error");
      socket.off("disconnect");
      socket.disconnect();
    };
  }, [roomId, initializePeerConnection]);

  // Toggle camera
  const handleToggleCamera = useCallback(() => {
    if (!localStreamRef.current) {
      console.warn("[Media] No local stream available");
      return;
    }

    const videoTracks = localStreamRef.current.getVideoTracks();
    console.log("[Media] Toggling camera, current tracks:", videoTracks.length);
    
    videoTracks.forEach((track) => {
      track.enabled = !track.enabled;
      console.log("[Media] Video track", track.id, "enabled:", track.enabled);
    });
    
    const newState = !cameraOn;
    setCameraOn(newState);

    if (socketRef.current) {
      socketRef.current.emit("toggleCamera", {
        roomId,
        cameraOn: newState,
      });
      console.log("[Socket] Sent toggleCamera event:", newState);
    }
  }, [cameraOn, roomId]);

  // Toggle microphone
  const handleToggleMic = useCallback(() => {
    if (!localStreamRef.current) {
      console.warn("[Media] No local stream available");
      return;
    }

    const audioTracks = localStreamRef.current.getAudioTracks();
    console.log("[Media] Toggling mic, current tracks:", audioTracks.length);
    
    audioTracks.forEach((track) => {
      track.enabled = !track.enabled;
      console.log("[Media] Audio track", track.id, "enabled:", track.enabled);
    });
    
    const newState = !micOn;
    setMicOn(newState);

    if (socketRef.current) {
      socketRef.current.emit("toggleMute", {
        roomId,
        isMuted: !newState,
      });
      console.log("[Socket] Sent toggleMute event, muted:", !newState);
    }
  }, [micOn, roomId]);

  // Hang up and end video call
  const handleHangUp = useCallback(() => {
    console.log("[WebRTC] Ending video call...");

    // Close peer connection
    if (peerConnectionRef.current) {
      console.log("[WebRTC] Peer connection state:", peerConnectionRef.current.connectionState);
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
      console.log("[WebRTC] Peer connection closed");
    }

    // Reset offer indicator
    offerSentRef.current = false;

    // Stop local stream
    if (localStreamRef.current) {
      const tracks = localStreamRef.current.getTracks();
      console.log("[Media] Stopping", tracks.length, "local stream tracks");
      tracks.forEach((track) => {
        track.stop();
        console.log("[Media] Stopped track:", track.kind, track.id);
      });
      localStreamRef.current = null;
    }

    // Emit leave video room event
    if (socketRef.current) {
      console.log("[Socket] Emitting leaveVideoRoom for:", roomId);
      socketRef.current.emit("leaveVideoRoom", roomId);
    }

    setConnected(false);
    setRemoteUserConnected(false);
    console.log("[WebRTC] Call ended, navigating back...");
    
    // Navigate back
    setTimeout(() => {
      navigate(-1);
    }, 500);
  }, [roomId, navigate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      handleHangUp();
    };
  }, [handleHangUp]);

  if (error) {
    return (
      <div className="video-room-error">
        <div className="error-content">
          <div className="error-icon">❌</div>
          <h2>Unable to start video call</h2>
          <p>{error}</p>
          <p className="error-hint">
            Troubleshooting steps:
          </p>
          <ul className="error-hints-list">
            <li>Check camera/microphone permissions in browser settings</li>
            <li>Ensure no other application is using your camera</li>
            <li>Try refreshing the page</li>
            <li>Check your internet connection</li>
            <li>Open browser console (F12) to see detailed error logs</li>
          </ul>
          <button onClick={() => window.location.reload()} className="retry-btn">
            Retry
          </button>
          <button onClick={() => navigate(-1)} className="back-btn">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (connecting) {
    return (
      <div className="video-room-loading">
        <div className="loading-content">
          <div className="spinner"></div>
          <h2>Initializing video call...</h2>
          <p>Setting up camera and microphone</p>
        </div>
      </div>
    );
  }

  return (
    <div className="video-room-container">
      {/* Main video area */}
      <div className="video-main">
        {/* Remote video (large) */}
        <div className="video-wrapper main-video">
          {remoteUserConnected ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="video-element"
            />
          ) : (
            <div className="video-placeholder">
              <div className="placeholder-content">
                <div className="waiting-icon">⏳</div>
                <p>Waiting for doctor to join...</p>
              </div>
            </div>
          )}
        </div>

        {/* Local video (small, PiP) */}
        <div className="video-wrapper local-video">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="video-element"
          />
          <span className="local-label">You</span>
        </div>
      </div>

      {/* Control bar */}
      <div className="video-controls">
        <div className="controls-group">
          <button
            className={`control-btn mic-btn ${!micOn ? "off" : ""}`}
            onClick={handleToggleMic}
            title={micOn ? "Mute" : "Unmute"}
          >
            {micOn ? "🎤" : "🔇"}
          </button>

          <button
            className={`control-btn camera-btn ${!cameraOn ? "off" : ""}`}
            onClick={handleToggleCamera}
            title={cameraOn ? "Turn off camera" : "Turn on camera"}
          >
            {cameraOn ? "📷" : "📸"}
          </button>

          <button
            className="control-btn hang-up-btn"
            onClick={handleHangUp}
            title="End call"
          >
            ☎️
          </button>
        </div>

        <div className="connection-status">
          {remoteUserConnected ? "Connected" : "Connecting..."}
        </div>
      </div>
    </div>
  );
};

export default VideoRoom;

