const { v4: uuidv4 } = require("uuid");
const Meeting = require("../models/Meeting");

// 🔹 Create a new meeting
const createMeeting = async (req, res) => {
  try {
    const meetingId = uuidv4(); // Generate a unique meeting ID

    // Save the meeting in MongoDB
    const newMeeting = new Meeting({
      meetingId,
      hostId: req.user.id, // Store the host (logged-in user)
      participants: [req.user.id], // Add the host as the first participant
    });

    await newMeeting.save();

    console.log(`✅ New Meeting Created: ${meetingId}`);
    res.status(201).json({ meetingId, message: "Meeting created successfully" });
  } catch (error) {
    console.error("❌ Error creating meeting:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// 🔹 Join an existing meeting
const joinMeeting = async (req, res) => {
  try {
    const { meetingId } = req.body;

    if (!meetingId) {
      return res.status(400).json({ message: "Meeting ID is required" });
    }

    // Find meeting and add user as a participant
    const meeting = await Meeting.findOne({ meetingId });

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    // Prevent duplicate participant entries
    if (!meeting.participants.includes(req.user.id)) {
      meeting.participants.push(req.user.id);
      await meeting.save();
    }

    console.log(`✅ User joined meeting: ${meetingId}`);
    res.status(200).json({ message: "Joined meeting successfully", meetingId });
  } catch (error) {
    console.error("❌ Error joining meeting:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// 🔹 Fetch past meetings
const getPastMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find({ hostId: req.user.id }).sort({ createdAt: -1 });
    res.json(meetings);
  } catch (error) {
    console.error("❌ Error fetching past meetings:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = { createMeeting, joinMeeting, getPastMeetings };