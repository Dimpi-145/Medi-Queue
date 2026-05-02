import React from 'react'
import './Navbar.scss'

const Navbar = ({ patient, loading, onLogout }) => {
  return (
    <header className="top-navbar">
      <div className="brand-section">
        <span className="brand-chip">MediQueue</span>
        <h1>Patient Portal</h1>
      </div>
      <div className="profile-actions">
        {loading ? (
          <div className="navbar-loading">Loading profile...</div>
        ) : (
          <>
            <div className="profile-pill">
              <img src={patient?.avatar} alt="Patient avatar" />
              <div>
                <p>Welcome back</p>
                <strong>{patient?.name}</strong>
              </div>
            </div>
            <button className="primary-button logout-button" onClick={onLogout}>
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  )
}

export default Navbar
