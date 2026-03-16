import { useState } from "react";
import { AuthContext } from "./AuthContext";
import { jwtDecode } from "jwt-decode";

const REQUIRED_ROLE = "BUILDING_MANAGER";

const AuthProvider = ({ children }) => {

  const [token, setToken] = useState(localStorage.getItem("token"));

  const [user, setUser] = useState(() => {
    const savedToken = localStorage.getItem("token");
    if (!savedToken) return null;

    try {
      const decoded = jwtDecode(savedToken);

      if (decoded.scope !== REQUIRED_ROLE) {
        localStorage.removeItem("token");
        return null;
      }

      return {
        email: decoded.sub,
        role: decoded.scope
      };

    } catch {
      return null;
    }
  });

  const login = (data) => {
    if (!data?.token) return false;

    const decoded = jwtDecode(data.token);
    if (decoded.scope !== REQUIRED_ROLE) {
      alert("Bạn không có quyền truy cập hệ thống này");
      return false;
    }

    localStorage.setItem("token", data.token);

    setToken(data.token);
    setUser({
      email: decoded.sub,
      role: decoded.scope
    });

    return true;
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