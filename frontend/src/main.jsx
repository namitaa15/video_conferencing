import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import MeetingRoom from "./pages/MeetingRoom";
import PastMeetings from "./pages/PastMeetings"; // Import new page
import "./index.css";
import { AuthProvider } from "./provider/auth";

const App = () => {
  return (
    <AuthProvider> {/* Wrap entire app with authentication context */}
      <Router>
        <Routes>
          <Route path="/" element={<Home />} /> {/* Home Page */}
          <Route path="/room/:roomId" element={<MeetingRoom />} /> {/* Video Call Page */}
          <Route path="/past-meetings" element={<PastMeetings />} /> {/* Past Meetings Page */}
        </Routes>
      </Router>
    </AuthProvider>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
