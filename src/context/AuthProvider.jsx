import { useState } from "react";
import { AuthContext } from "./AuthContext";
import { jwtDecode } from "jwt-decode";

const AuthProvider = ({ children }) => {

  const [token, setToken] = useState(localStorage.getItem("token"));

  const [user, setUser] = useState(() => {
    const savedToken = localStorage.getItem("token");
    if (!savedToken) return null;

    try {
      const decoded = jwtDecode(savedToken);
      return {
        email: decoded.sub
      };
    } catch {
      return null;
    }
  });

  const login = (data) => {
    if (!data?.token) return;

    localStorage.setItem("token", data.token);

    const decoded = jwtDecode(data.token);

    setToken(data.token);
    setUser({
      email: decoded.sub
    });
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;