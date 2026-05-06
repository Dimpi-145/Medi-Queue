import React from "react";
import "./ProfileCard.scss";

const ProfileCard = ({
  patient,
  loading,
  appointmentsCount,
  reportsAvailable,
  onBookClick,
}) => {
  return (
    <section className="card-panel profile-card">

      {/* HEADER */}
      <div className="profile-header">
        <div>
          <p className="eyebrow">Patient Profile</p>
          <h2>My Health Summary</h2>

          {/* ✅ Clean text-only identity */}
          <h3 className="patient-name">
            {patient?.name || "Patient"}
          </h3>
          <p className="patient-email">
            {patient?.email}
          </p>
        </div>

        <button className="book-btn" onClick={onBookClick}>
          Book Appointment
        </button>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="panel-empty">Loading profile...</div>
      ) : (
        <>

          {/* DETAILS */}
          <div className="patient-details">
            <div className="detail-card">
              <span>Age</span>
              <strong>{patient?.age || "-"}</strong>
            </div>

            <div className="detail-card">
              <span>Gender</span>
              <strong>{patient?.gender || "-"}</strong>
            </div>

            <div className="detail-card">
              <span>Phone</span>
              <strong>{patient?.phone || "-"}</strong>
            </div>
          </div>

          {/* METRICS */}
          <div className="metric-grid">
            <div className="metric-card">
              <p>Appointments</p>
              <strong>{appointmentsCount}</strong>
            </div>

            <div className="metric-card">
              <p>Reports</p>
              <strong>{reportsAvailable}</strong>
            </div>
          </div>

        </>
      )}
    </section>
  );
};

export default ProfileCard;