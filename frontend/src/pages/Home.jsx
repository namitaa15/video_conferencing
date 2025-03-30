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
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/meetings/create`
        ,
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
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/meetings/join`
      ,
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
      <Navbar />
  
      <div className="flex flex-col items-center justify-center text-center p-6 mt-12">
        {/* Heading */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 sm:mb-6 flex flex-wrap justify-center gap-2 drop-shadow-lg text-center">
          Welcome {user?.name}! 👋
        </h1>
  
        <p className="text-base sm:text-lg text-white/80 max-w-xs sm:max-w-md mb-6 sm:mb-8">
          Create or join real-time video calls with screen sharing, host controls & chat support.
        </p>
  
        {/* Start + Join Section */}
        <div className="w-full max-w-md flex flex-col gap-4 sm:gap-3 bg-white bg-opacity-20 p-6 rounded-xl shadow-lg backdrop-blur-md">
          <button
            onClick={startMeeting}
            className="bg-blue-500 hover:bg-blue-700 px-6 py-3 text-sm sm:text-lg font-semibold rounded-full shadow-md transition-all duration-300 w-full"
          >
            ➕ Start New Meeting
          </button>
  
          <input
            type="text"
            placeholder="Enter Meeting Code"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="px-4 py-2 text-black text-sm sm:text-lg rounded-full outline-none border-none shadow-md focus:ring-2 focus:ring-purple-400 transition-all w-full"
          />
  
          <button
            onClick={joinMeeting}
            className="bg-green-500 hover:bg-green-700 px-6 py-3 text-sm sm:text-lg font-semibold rounded-full shadow-md transition-all duration-300 w-full"
          >
            🔗 Join
          </button>
        </div>
      </div>
    </div>
  );
};  

  

export default Home;