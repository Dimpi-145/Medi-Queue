import React from "react";
import "./Navbar.scss";

const Navbar = ({ doctorName, onLogout }) => {
  const initials = doctorName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="doctor-navbar">
      <div className="doctor-profile">
        <div className="avatar">{initials}</div>
        <div className="profile-meta">
          <span className="small-label">Doctor</span>
          <h2>{doctorName}</h2>
        </div>
      </div>
      <button className="btn-logout" onClick={onLogout}>
        Logout
      </button>
    </div>
  );
};

export default Navbar;
