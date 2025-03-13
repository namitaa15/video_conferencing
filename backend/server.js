const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const passport = require("passport");
const session = require("express-session");
const cors = require("cors");
require("dotenv").config();
require("./config/passport"); // Google OAuth setup

const authRoutes = require("./routes/authRoutes");

const app = express();
const server = http.createServer(app);

// ✅ CORS Middleware (Allow frontend to connect)
app.use(cors({ origin: "*", methods: ["GET", "POST"] }));

// ✅ Session Middleware (Required for Passport)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_secret_key",
    resave: false,
    saveUninitialized: true,
  })
);

// ✅ Passport Middleware (OAuth Authentication)
app.use(passport.initialize());
app.use(passport.session());

// ✅ Routes
app.use("/api/auth", authRoutes);

// ✅ WebSocket Setup
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// ✅ WebRTC Signaling with Socket.io
io.on("connection", (socket) => {
  console.log(`🔗 New WebSocket connection: ${socket.id}`);

  // When a user joins a meeting
  socket.on("join-meeting", ({ meetingId, userId }) => {
    console.log(`📢 User ${userId} joined meeting: ${meetingId}`);
    socket.join(meetingId);
    io.to(meetingId).emit("user-joined", { userId });
  });

  // WebRTC Offer
  socket.on("offer", (data) => {
    io.to(data.meetingId).emit("offer", data);
  });

  // WebRTC Answer
  socket.on("answer", (data) => {
    io.to(data.meetingId).emit("answer", data);
  });

  // ICE Candidate
  socket.on("ice-candidate", (data) => {
    io.to(data.meetingId).emit("ice-candidate", data);
  });

  // Handle User Disconnection
  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

// ✅ Start Server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});