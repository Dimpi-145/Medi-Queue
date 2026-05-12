# MediQueue Chat & Video - Quick Reference

## 🚀 Quick Start

### For Patient
1. Dashboard → Visit History → Click "Open Chat"
2. Send message (appears instantly to doctor)
3. Click 📹 to request video call
4. Wait for doctor to accept
5. Video room opens automatically

### For Doctor  
1. Dashboard → History → Click "Open Chat"
2. See patient messages in real-time
3. Respond with messages
4. Accept video requests when they arrive
5. Video room opens automatically

## 🔧 Key Fixes Implemented

| Issue | Fix | File |
|-------|-----|------|
| Messages not appearing to doctor | Emit to user rooms + consultation room | chat.controller.js |
| "No Active Messages" | Proper room joining on socket connect | ChatConsultation.jsx |
| Video call not starting | Full WebRTC implementation with proper signaling | VideoRoom.jsx |
| Camera/audio not opening | getUserMedia with error handling | VideoRoom.jsx |
| Duplicate listeners | Cleanup in useEffect return | ChatConsultation.jsx |
| Small chat UI | Full-screen modern design | ChatConsultation.scss |
| Chat history not loading | Backend query + useEffect fetch | ChatConsultation.jsx |

## 🔌 Socket Events Reference

### Chat Events
```javascript
// Patient sends message
socket.emit("newMessage") → Received by Doctor
socket.emit("videoRequestReceived") → Sent to Doctor

// Doctor sends message
socket.emit("newMessage") → Received by Patient
socket.emit("videoRequestAccepted") → Sent to Patient
socket.emit("videoRequestRejected") → Sent to Patient
```

### Video Events
```javascript
// Signaling
socket.emit("sendOffer", {roomId, offer, from})
socket.on("receiveOffer", (offer) => {})

socket.emit("sendAnswer", {roomId, answer, from})
socket.on("receiveAnswer", (answer) => {})

socket.emit("sendIceCandidate", {roomId, candidate, from})
socket.on("receiveIceCandidate", (candidate) => {})

// Media Controls
socket.emit("toggleMute", {roomId, isMuted})
socket.emit("toggleCamera", {roomId, cameraOn})
```

## 📊 Component Hierarchy

```
DoctorDashboard/PatientDashboard
  ├── DoctorHistory/History
  │   └── (Click Open Chat)
  │       └── DoctorChatConsultation/ChatConsultation
  │           ├── Message List
  │           ├── Video Request Button
  │           └── Input Area
  │               └── (Click Video Button)
  │                   └── VideoRoom
  │                       ├── Local Video (PiP)
  │                       ├── Remote Video (Main)
  │                       └── Controls (Mic, Camera, Hangup)
```

## ✅ Verification Checklist

### Backend
- [ ] server.js has new Socket.IO event handlers
- [ ] chat.controller.js emits to user rooms
- [ ] video.controller.js emits to both users

### Frontend Routes
- [ ] /patient/chat/:appointmentId exists
- [ ] /doctor/chat/:appointmentId exists  
- [ ] /video-room/:roomId exists

### Components
- [ ] ChatConsultation.jsx exists
- [ ] DoctorChatConsultation.jsx exists
- [ ] VideoRoom.jsx is WebRTC-enabled
- [ ] Old ChatBox no longer imported

### Styles
- [ ] ChatConsultation.scss exists
- [ ] VideoRoom.scss is updated
- [ ] DoctorHistory styles include chat button

## 🐛 Common Issues & Fixes

### Issue: "Messages still not showing to doctor"
**Cause:** Socket not joining user room
**Fix:** Check that `joinUserRoom` is called with correct userId
**Verify:** 
```javascript
const userId = localStorage.getItem("userId");
socket.emit("joinUserRoom", userId);
```

### Issue: "Video button doesn't appear"
**Cause:** Component not displaying for doctor role
**Fix:** Ensure `currentUserRole` is correctly set
**Verify:**
```javascript
const currentUserRole = localStorage.getItem("userRole") || "patient";
```

### Issue: "Camera permission error"
**Cause:** Browser permissions not granted
**Fix:** 
1. Check browser allows camera/mic
2. Use HTTPS (required for getUserMedia)
3. Allow permission when prompted

### Issue: "No remote video showing"
**Cause:** ICE candidates not exchanging
**Fix:** Check STUN server accessibility
**Verify:** Check browser console for WebRTC logs
```javascript
peerConnection.onicecandidate = (event) => {
  console.log("ICE Candidate:", event.candidate);
};
```

### Issue: "Duplicate messages appearing"
**Cause:** Socket listeners not cleaning up
**Fix:** Verify useEffect cleanup is called
**Verify:**
```javascript
return () => {
  socket.off("newMessage");
  socket.disconnect();
};
```

## 🔑 Key Variables to Check

```javascript
// localStorage
userId = localStorage.getItem("userId")
userRole = localStorage.getItem("userRole")  // "doctor" or "patient"

// Route params
appointmentId = params.appointmentId
roomId = params.roomId

// Socket rooms
`consultation-${appointmentId}`
userId.toString()
roomId
```

## 📱 Responsive Design

**Chat UI breakpoints:**
- Desktop (>768px): Full layout
- Tablet (600-768px): Adjusted layout
- Mobile (<600px): Optimized for small screens

**Video Room breakpoints:**
- Desktop: Large remote video + PiP local
- Mobile: Full screen + bottom local PiP

## 🎨 Design System

```scss
// Colors
Primary: #667eea → #764ba2 (gradient)
Success: #10b981
Error: #ef4444
Background: #000 (video) / white (chat)

// Typography
Font: -apple-system, BlinkMacSystemFont, "Segoe UI"
Sizes: 12px (small), 14px (body), 18px (heading)
Weight: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

// Spacing
xs: 4px, sm: 8px, md: 12px, lg: 16px, xl: 20px, 2xl: 24px
```

## 🔄 Message Flow Sequence

```
1. Patient clicks "Send" button
   ↓
2. sendChatMessage(appointmentId, message) called
   ↓
3. Backend: /chat/send endpoint
   ↓
4. Message saved to MongoDB
   ↓
5. Emit to:
   - Patient room (confirmation)
   - Doctor room (receipt)
   - Consultation room (context)
   ↓
6. Socket listener receives "newMessage"
   ↓
7. setMessages state updated
   ↓
8. Message rendered in chat UI
```

## 🎥 Video Call Sequence

```
1. Patient clicks "Request Video"
   ↓
2. requestVideoConsultation(appointmentId) called
   ↓
3. Backend: /video/request endpoint
   ↓
4. Emit "videoRequestReceived" to doctor
   ↓
5. Doctor sees request panel
   ↓
6. Doctor clicks "Accept"
   ↓
7. Backend: /video/respond with action="accept"
   ↓
8. Emit "videoRequestAccepted" to patient
   ↓
9. Both redirect to /video-room/{roomId}
   ↓
10. VideoRoom initializes WebRTC
    ↓
11. Both emit "joinVideoRoom" to socket
    ↓
12. Exchange offers, answers, ICE candidates
    ↓
13. Video streams established
```

## 📚 API Endpoints Summary

```javascript
// Chat
POST   /chat/send           - Send message
GET    /chat/history/:id    - Get chat history

// Video
POST   /video/request       - Request video consultation
POST   /video/respond       - Accept/Reject video
GET    /video/requests      - Get pending video requests
GET    /video/status/:id    - Get video request status
```

## 🚨 Debugging Commands

```javascript
// Check Socket connection
console.log(socketRef.current.connected)

// Check messages
console.log(messages)

// Check peer connection
console.log(peerConnectionRef.current.connectionState)

// Check local stream
console.log(localStreamRef.current.getTracks())

// Monitor Socket events
socket.onAny((eventName, ...args) => {
  console.log(`Socket event: ${eventName}`, args)
})
```

## 📞 Support Resources

- **WebRTC Documentation:** https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API
- **Socket.IO Guide:** https://socket.io/docs/
- **MongoDB Chat Schema:** Check chatMessage.model.js
- **Browser DevTools:** F12 → Console, Network, Application tabs

---
**Last Updated:** 2026-05-12
**Status:** ✅ Fully Implemented
