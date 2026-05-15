import { createContext, useState, useEffect } from "react";

export const authContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch (err) {
      return null;
    }
  });

  const handleLogin = (user) => {
    setUser(user);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("username");
      localStorage.removeItem("role");
      localStorage.removeItem("userId");
      localStorage.removeItem("doctorId");
    } catch (err) {}

    setUser(null);
  };

  // keep localStorage user in sync if context changes elsewhere
  useEffect(() => {
    try {
      if (user) localStorage.setItem("user", JSON.stringify(user));
      else localStorage.removeItem("user");
    } catch (err) {}
  }, [user]);

  return (
    <authContext.Provider value={{ user, setUser, handleLogin, handleLogout }}>
      {children}
    </authContext.Provider>
  );
};