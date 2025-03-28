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
        {/* Title */}
        <h1 className="text-5xl font-extrabold mb-6 flex items-center gap-2 drop-shadow-lg">
          Real-Time Video Conferencing 🎥
        </h1>

        {/* Start Meeting Button */}
        <button
          onClick={startMeeting}
          className="bg-blue-500 hover:bg-blue-700 px-8 py-3 text-xl font-semibold rounded-full shadow-lg transition-all duration-300 mb-6"
        >
          Start a New Meeting
        </button>

        {/* Join Meeting Section */}
        <div className="flex space-x-4 mt-4 bg-white bg-opacity-20 p-4 rounded-lg shadow-lg backdrop-blur-md">
          <input
            type="text"
            placeholder="Enter Meeting Code"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="px-4 py-3 text-black text-lg rounded-full outline-none border-none shadow-md focus:ring-2 focus:ring-purple-400 transition-all"
          />
          <button
            onClick={joinMeeting}
            className="bg-green-500 hover:bg-green-700 px-6 py-3 text-lg rounded-full shadow-lg transition-all duration-300"
          >
            Join Meeting
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;