import axios from "axios";
import { useEffect, useState } from "react";
import AuthContext from "../context/AuthContext";

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    // Fetch user data from the backend (checks if logged in)
    useEffect(() => {
        axios
            .get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/user`, { withCredentials: true })
            .then((res) => {
                setUser(res.data.user);
            })
            .catch(() => setUser(null));
    }, []);

    const logout = async () => {
        try {
            await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/logout`, { withCredentials: true });
            setUser(null);
        } catch (err) {
            console.error(err);
        }
    };

    return <AuthContext.Provider value={{ user, logout }}>{children}</AuthContext.Provider>;
};

