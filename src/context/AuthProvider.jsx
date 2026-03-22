import { useState } from "react";
import { AuthContext } from "./AuthContext";
import { jwtDecode } from "jwt-decode";

const REQUIRED_ROLE = "BUILDING_MANAGER";

const AuthProvider = ({ children }) => {

  const [token, setToken] = useState(sessionStorage.getItem("token"));

  const [user, setUser] = useState(() => {
    const savedToken = sessionStorage.getItem("token");
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

    sessionStorage.setItem("token", data.token);

    setToken(data.token);
    setUser({
      email: decoded.sub,
      role: decoded.scope
    });

    return true;
  };

  const logout = () => {
    sessionStorage.removeItem("token");
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