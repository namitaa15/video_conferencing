require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const passport = require("passport");
const session = require("express-session");
const cors = require("cors");
const mongoose = require("mongoose");

require("./config/passport"); // Google OAuth config

const authRoutes = require("./routes/authRoutes");
const meetingRoutes = require("./routes/meetingRoutes");

const app = express();
const server = http.createServer(app);

// ✅ Socket.io setup with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN, // your frontend e.g., vercel
    methods: ["GET", "POST"],
    credentials: true
  }
});

// ✅ MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Express Middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  methods: ["GET", "POST"],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.set("trust proxy", 1); // 🚨 Needed for secure cookies on Render


// ✅ Secure Session (important for Google login to work)
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,           // ✅ IMPORTANT: true for HTTPS
      sameSite: "none",       // ✅ IMPORTANT: for cross-site cookies
    },
  })
);


// ✅ Passport for Google OAuth
app.use(passport.initialize());
app.use(passport.session());

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/meetings", meetingRoutes);

// ✅ Test route
app.get("/", (req, res) => {
  res.send("🎉 Backend is running! This is the API server.");
});

// ✅ WebSocket logic
const userNames = {}; // socket.id => name

io.on("connection", (socket) => {
  console.log(`🔗 New WebSocket connection: ${socket.id}`);

  socket.on("join-meeting", ({ meetingId, userId, name, avatar }) => {
    userNames[socket.id] = name;
    socket.join(meetingId);
    socket.to(meetingId).emit("request-join", { userId });
  });

  socket.on("approve-user", ({ meetingId, userId }) => {
    io.to(userId).emit("approved");
    io.to(meetingId).emit("user-joined", { userId });
  });

  socket.on("deny-user", ({ meetingId, userId }) => {
    io.to(userId).emit("denied");
  });

  // WebRTC Signaling
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
  socket.on("chat-message", ({ meetingId, name, avatar, message }) => {
    io.to(meetingId).emit("chat-message", {
      userId: socket.id,
      name,
      avatar,
      message,
      time: new Date().toLocaleTimeString()
    });
  });

  // Host Controls
  socket.on("mute-user", ({ targetId }) => {
    io.to(targetId).emit("force-mute");
  });

  socket.on("kick-user", ({ targetId }) => {
    io.to(targetId).emit("force-kick");
  });
  socket.on("disconnect", () => {
    console.log(`❌ Disconnected: ${socket.id}`);
    delete userNames[socket.id];
  
    // 🚨 Tell others that this user left
    for (let roomId of socket.rooms) {
      if (roomId !== socket.id) {
        io.to(roomId).emit("user-disconnected", { userId: socket.id });
      }
    }
  });
  
});

// ✅ Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});