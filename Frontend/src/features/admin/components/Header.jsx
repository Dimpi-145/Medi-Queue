// components/Header.jsx
import React from "react";
import "./Header.scss";

const Header = () => {
  return (
    <div className="header">
      <h1>Admin Dashboard</h1>

      <div className="admin-info">
        <span>Admin</span>
      </div>
    </div>
  );
};

export default Header;