import React from "react";
import "./Navbar.scss";

const Navbar = ({ doctorName = "Doctor", onLogout }) => {
  const displayName = doctorName || "Doctor";
  const initials = displayName
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
          <h2>{displayName}</h2>
        </div>
      </div>
      <button type="button" className="btn-logout" onClick={onLogout}>
        Logout
      </button>
    </div>
  );
};

export default Navbar;
