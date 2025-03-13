const express = require("express");
const { createMeeting, joinMeeting } = require("../controllers/meetingController");
const protectRoute = require("../middleware/authMiddleware"); // Protect meetings with authentication

const router = express.Router();

// 🔹 Route to create a new meeting
router.post("/create", protectRoute, createMeeting);

// 🔹 Route to join an existing meeting
router.post("/join", protectRoute, joinMeeting);

module.exports = router;