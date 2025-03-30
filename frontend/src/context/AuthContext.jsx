import { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Fetch user data from the backend (checks if logged in)
  useEffect(() => {
    axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/user`, { withCredentials: true }
, { withCredentials: true })
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null));
  }, []);

  const logout = () => {
    axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/auth/logout`, { withCredentials: true })
    , { withCredentials: true }
      .then(() => setUser(null))
      .catch((err) => console.error(err));
  };

  return (
    <AuthContext.Provider value={{ user, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);