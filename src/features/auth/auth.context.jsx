import { createContext, useState, useContext } from "react";

export const authContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const handleLogin = (user) => {
    setUser(user);
  };


  return (
    <authContext.Provider value={{ user, setUser, handleLogin  }}>
      {children}
    </authContext.Provider>
  );
};