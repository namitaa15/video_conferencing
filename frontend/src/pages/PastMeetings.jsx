import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import axios from "axios";

const PastMeetings = () => {
  const [meetings, setMeetings] = useState([]);
  const navigate = useNavigate();

  // Fetch past meetings from the backend
  useEffect(() => {
    axios.get("http://localhost:5001/api/meetings/past")
      .then((res) => setMeetings(res.data))
      .catch((err) => console.error("Error fetching meetings:", err));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-800 to-black text-white">
      <Navbar />
      <div className="container mx-auto py-10 px-6">
        <h1 className="text-4xl font-extrabold mb-6 text-center">📜 Past Meetings</h1>

        {meetings.length === 0 ? (
          <p className="text-center text-gray-400">No past meetings found.</p>
        ) : (
          <div className="space-y-6">
            {meetings.map((meeting) => (
              <div key={meeting.meetingId} className="bg-gray-900 p-4 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold">Meeting ID: {meeting.meetingId}</h2>
                <p className="text-gray-400">📅 Date: {new Date(meeting.createdAt).toLocaleString()}</p>
                <p className="text-gray-400">👥 Participants: {meeting.participants.length}</p>

                <div className="flex space-x-4 mt-4">
                  <button
                    className="bg-blue-500 hover:bg-blue-700 px-4 py-2 rounded-md shadow-md"
                    onClick={() => navigate(`/room/${meeting.meetingId}`)}
                  >
                    🔄 Rejoin Meeting
                  </button>
                  <button
                    className="bg-green-500 hover:bg-green-700 px-4 py-2 rounded-md shadow-md"
                    onClick={() => alert("Chat feature coming soon!")}
                  >
                    💬 View Chat
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PastMeetings;