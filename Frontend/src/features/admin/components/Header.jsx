// components/Header.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { logout as logoutApi } from "../../auth/services/auth.api";
import "./Header.scss";

const Header = ({ title = "Admin Dashboard", roleLabel = "Admin" }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      ["token", "user", "username", "role", "userId", "doctorId"].forEach(
        (key) => localStorage.removeItem(key),
      );
      navigate("/login");
    }
  };

  return (
    <div className="header">
      <h1>{title}</h1>

      <div className="admin-info">
        <span>{roleLabel}</span>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Header;
