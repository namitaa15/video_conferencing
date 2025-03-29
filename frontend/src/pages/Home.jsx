import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidV4 } from "uuid"; // Generates unique meeting codes
import Navbar from "../components/Navbar"; // Import Navbar
import { useAuth } from "../context/AuthContext"; // To access logged-in user
const Home = () => {
  const { user } = useAuth();

  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();

  // Function to start a new meeting
  const startMeeting = async () => {
    try {
      const res = await axios.post(
        "http://localhost:5001/api/meetings/create",
        {},
        { withCredentials: true }
      );
  
      const meetingId = res.data.meetingId;
      navigate(`/room/${meetingId}`);
    } catch (error) {
      console.error("Error creating meeting:", error);
      alert("Failed to create meeting.");
    }
  };

  // Function to join a meeting
  const joinMeeting = async () => {
    if (roomId.trim() === "") return;
  
    try {
      await axios.post(
        "http://localhost:5001/api/meetings/join",
        { meetingId: roomId },
        { withCredentials: true }
      );
  
      navigate(`/room/${roomId}`);
    } catch (error) {
      console.error("Error joining meeting:", error);
      alert("Failed to join meeting. Please check the Meeting ID.");
    }
  };
  

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-600 to-blue-600 text-white">
      {/* Navbar */}
      <Navbar />
  
      {/* Main Content */}
      <div className="flex flex-col items-center justify-center text-center p-6 mt-12">
        {/* Heading */}
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-6 flex items-center gap-2 drop-shadow-lg">
          Welcome {user?.name}! 👋
        </h1>
  
        <p className="text-lg text-white/80 max-w-md mb-8">
          Create or join real-time video calls with screen sharing, host controls & chat support.
        </p>
  
        {/* Start + Join Section (Responsive) */}
        <div className="w-full max-w-xl flex flex-col sm:flex-row items-center gap-4 mt-2 bg-white bg-opacity-20 p-6 rounded-lg shadow-lg backdrop-blur-md">
          {/* Start Meeting */}
          <button
            onClick={startMeeting}
            className="bg-blue-500 hover:bg-blue-700 px-6 py-3 text-base sm:text-lg font-semibold rounded-full shadow-md transition-all duration-300 w-full sm:w-auto"
          >
            ➕ Start New Meeting
          </button>
  
          {/* Input for Join */}
          <input
            type="text"
            placeholder="Enter Meeting Code"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="flex-1 px-4 py-2 text-black text-base sm:text-lg rounded-full outline-none border-none shadow-md focus:ring-2 focus:ring-purple-400 transition-all w-full"
          />
  
          {/* Join Button */}
          <button
            onClick={joinMeeting}
            className="bg-green-500 hover:bg-green-700 px-6 py-3 text-base sm:text-lg rounded-full shadow-md transition-all duration-300 w-full sm:w-auto"
          >
            🔗 Join
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;