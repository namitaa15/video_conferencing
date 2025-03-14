import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
      <h1 className="text-2xl font-bold">🎥 Video Conferencing</h1>

      <div className="flex items-center gap-6">
        {/* Navigation Links */}
        <Link to="/" className="hover:underline">🏠 Home</Link>
        <Link to="/past-meetings" className="hover:underline">📜 Past Meetings</Link>

        {user ? (
          <div className="flex items-center gap-4">
            <img src={user.avatar} alt="Profile" className="w-10 h-10 rounded-full border-2 border-white" />
            <span className="font-semibold">Welcome, {user.name}</span>
            <button 
              onClick={logout} 
              className="bg-red-500 px-4 py-2 rounded-md shadow-md hover:bg-red-700 transition-all"
            >
              Logout
            </button>
          </div>
        ) : (
          <a 
            href="http://localhost:5001/api/auth/google" 
            className="bg-white text-black px-4 py-2 rounded-md shadow-md hover:bg-gray-200 transition-all"
          >
            Login with Google
          </a>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
