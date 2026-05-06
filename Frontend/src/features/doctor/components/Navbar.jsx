import React from "react";
import {
  LogOut,
  ShieldCheck,
} from "lucide-react";

import "./Navbar.scss";

const Navbar = ({ doctorName, onLogout }) => {

  const initials = doctorName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="doctor-navbar">

      {/* ================= LEFT ================= */}
      <div className="doctor-profile">

        <div className="avatar">
          {initials}
        </div>

        <div className="profile-meta">

          <span className="small-label">
            MediQueue Doctor Portal
          </span>

          <h2>{doctorName}</h2>

          <div className="doctor-status">

            <span className="status-dot" />

            <span>Available for Consultation</span>

          </div>

        </div>

      </div>

      {/* ================= RIGHT ================= */}
      <div className="navbar-actions">

        <div className="system-badge">

          <ShieldCheck size={15} />

          <span>System Active</span>

        </div>

        <button
          className="btn-logout"
          onClick={onLogout}
        >

          <LogOut size={16} />

          Logout

        </button>

      </div>

    </header>
  );
};

export default Navbar;