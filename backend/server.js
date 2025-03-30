const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const passport = require("passport");
const session = require("express-session");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
require("./config/passport");

const authRoutes = require("./routes/authRoutes");
const meetingRoutes = require("./routes/meetingRoutes");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST"],
  },
});

// ✅ MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Middleware
app.use(cors({
  origin: "https://video-conferencing-bice.vercel.app",
  methods: ["GET", "POST"],
  credentials: true,
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || "your_secret_key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    sameSite: "none"
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/meetings", meetingRoutes);

// ✅ Socket.io with Real Names
const userNames = {}; // socket.id => full name

io.on("connection", (socket) => {
  console.log(`🔗 New WebSocket connection: ${socket.id}`);

  // Join Meeting
  socket.on("join-meeting", ({ meetingId, userId, name }) => {
    userNames[socket.id] = name;
    console.log(`📢 ${name} (${userId}) wants to join ${meetingId}`);
    socket.join(meetingId);
    socket.to(meetingId).emit("request-join", { userId });
  });

  // Host Approve/Deny
  socket.on("approve-user", ({ meetingId, userId }) => {
    io.to(userId).emit("approved");
    io.to(meetingId).emit("user-joined", { userId });
  });

  socket.on("deny-user", ({ meetingId, userId }) => {
    io.to(userId).emit("denied");
  });

  // WebRTC Exchange
  socket.on("offer", (data) => {
    io.to(data.meetingId).emit("offer", data);
  });

  socket.on("answer", (data) => {
    io.to(data.meetingId).emit("answer", data);
  });

  socket.on("ice-candidate", (data) => {
    io.to(data.meetingId).emit("ice-candidate", data);
  });

  // 💬 Chat with Real Name & Timestamp
  socket.on("chat-message", ({ meetingId, message }) => {
    io.to(meetingId).emit("chat-message", {
      userId: socket.id,
      name: userNames[socket.id],
      message,
      time: new Date().toLocaleTimeString(),
    });
  });

  // Mute / Kick
  socket.on("mute-user", ({ targetId }) => {
    io.to(targetId).emit("force-mute");
  });  
  socket.on("kick-user", ({ targetId }) => {
    io.to(targetId).emit("force-kick");
  });
  

  // Disconnect Cleanup
  socket.on("disconnect", () => {
    console.log(`❌ Disconnected: ${socket.id}`);
    delete userNames[socket.id];
  });
});
app.get("/", (req, res) => {
  res.send("🎉 Backend is running! This is the API server.");
});
// ✅ Start Server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
