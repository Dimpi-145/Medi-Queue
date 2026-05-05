// components/Header.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "./Header.scss";

const Header = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="header">
      <h1>Admin Dashboard</h1>

      <div className="admin-info">
        <span>Admin</span>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Header;