import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import axios from "axios";
import { useAuth } from "../hooks/auth";

const PastMeetings = () => {
  const [meetings, setMeetings] = useState([]);
  const navigate = useNavigate();
  const { token } = useAuth(); // ✅ get token from context

  // Fetch past meetings from the backend
  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/meetings/join`, {
          headers: {
            Authorization: `Bearer ${token}`, // ✅ send token in request
          },
        });
        setMeetings(res.data);
      } catch (err) {
        console.error("Error fetching meetings:", err);
      }
    };

    if (token) {
      fetchMeetings();
    }
  }, [token]); // ✅ run effect only when token is available

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

                <div className="flex flex-col sm:flex-row gap-3 mt-4">
  <button className="bg-blue-500 hover:bg-blue-700 px-4 py-2 rounded-md shadow-md w-full sm:w-auto">
    🔄 Rejoin Meeting
  </button>
  <button className="bg-green-500 hover:bg-green-700 px-4 py-2 rounded-md shadow-md w-full sm:w-auto">
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
