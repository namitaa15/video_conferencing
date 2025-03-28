const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const passport = require("passport");
const session = require("express-session");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
require("./config/passport"); // Google OAuth setup

const authRoutes = require("./routes/authRoutes");
const meetingRoutes = require("./routes/meetingRoutes"); // Don't forget this if you're using meeting APIs

const app = express();
const server = http.createServer(app);

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ Connected to MongoDB"))
.catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ CORS Middleware (Allow frontend to connect with credentials)
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST"],
  credentials: true
}));

// ✅ Middleware
app.use(express.json()); // To parse JSON bodies
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_secret_key",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/meetings", meetingRoutes); // For create/join/past meetings

// ✅ WebSocket Setup
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`🔗 New WebSocket connection: ${socket.id}`);

  // 🚪 Join request
  socket.on("join-meeting", ({ meetingId, userId }) => {
    console.log(`📢 User ${userId} wants to join ${meetingId}`);
    socket.join(meetingId);
    socket.to(meetingId).emit("request-join", { userId });
  });

  // ✅ Host controls
  socket.on("approve-user", ({ meetingId, userId }) => {
    io.to(userId).emit("approved");
    io.to(meetingId).emit("user-joined", { userId });
  });

  socket.on("deny-user", ({ meetingId, userId }) => {
    io.to(userId).emit("denied");
  });

  // 🔁 WebRTC
  socket.on("offer", (data) => {
    io.to(data.meetingId).emit("offer", data);
  });

  socket.on("answer", (data) => {
    io.to(data.meetingId).emit("answer", data);
  });

  socket.on("ice-candidate", (data) => {
    io.to(data.meetingId).emit("ice-candidate", data);
  });

  // 💬 Chat
  socket.on("chat-message", ({ meetingId, userId, message }) => {
    io.to(meetingId).emit("chat-message", { userId, message });
  });

  // 🔇 Mute
  socket.on("mute-user", ({ meetingId }) => {
    socket.to(meetingId).emit("force-mute");
  });

  // ❌ Kick
  socket.on("kick-user", ({ meetingId }) => {
    socket.to(meetingId).emit("force-kick");
  });

  // 🔌 Disconnect
  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

// ✅ Start Server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});