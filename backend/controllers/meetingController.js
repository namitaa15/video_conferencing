const { v4: uuidv4 } = require("uuid");

// 🔹 Create a new meeting
const createMeeting = async (req, res) => {
  try {
    const meetingId = uuidv4(); // Generate a unique meeting ID

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

    console.log(`✅ User joined meeting: ${meetingId}`);

    res.status(200).json({ message: "Joined meeting successfully", meetingId });
  } catch (error) {
    console.error("❌ Error joining meeting:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = { createMeeting, joinMeeting };