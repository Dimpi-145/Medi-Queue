import React from "react";
import "./Navbar.scss";

const Navbar = ({ patient, loading, onLogout }) => {
  return (
    <header className="top-navbar">
      {/* LEFT SECTION */}
      <div className="brand-section">
        <span className="brand-chip">MediQueue</span>
        <h1>Patient Portal</h1>
      </div>

      {/* RIGHT SECTION */}
      <div className="profile-actions">
        {loading ? (
          <div className="navbar-loading">Loading profile...</div>
        ) : (
          <>
            {/* ❌ Avatar removed */}
            <div className="profile-pill">
              <div className="profile-text">
                <p>
                  Welcome back,{" "}
                  <strong>{patient?.username || "Patient"}</strong>
                </p>
              </div>
            </div>

            <button className="primary-button logout-button" onClick={onLogout}>
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;
