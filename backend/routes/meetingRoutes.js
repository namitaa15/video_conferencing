const express = require("express");
const { createMeeting, joinMeeting, getPastMeetings } = require("../controllers/meetingController");
const protectRoute = require("../middleware/authMiddleware"); // Ensure only authenticated users can access

const router = express.Router();

// 🔹 Route to create a new meeting
router.post("/create", protectRoute, createMeeting);

// 🔹 Route to join an existing meeting
router.post("/join", protectRoute, joinMeeting);

// 🔹 Route to fetch past meetings
router.get("/past", protectRoute, getPastMeetings);

module.exports = router;