import React from "react";
import "./PatientDetails.scss";

const PatientDetails = ({ patient }) => {
  if (!patient) {
    return (
      <div className="detail-card empty-card">
        <h3>Select a patient from the queue</h3>
        <p>Patient details will appear here once you choose a name.</p>
      </div>
    );
  }

  return (
    <div className="detail-card">
      <div className="detail-header">
        <div className="patient-avatar">{patient.username.split(" ").map((part) => part[0]).join("")}</div>
        <div>
          <h3>{patient.username}</h3>
          <p className="subtle-text">{patient.age} years · {patient.gender}</p>
        </div>
      </div>

      <div className="detail-grid">
        <div>
          <span className="label">Email</span>
          <p>{patient.email}</p>
        </div>
        <div>
          <span className="label">Role</span>
          <p>{patient.role}</p>
        </div>
      </div>

      <div className="medical-info">
        <span className="label">Medical note</span>
        <p>No additional medical information available.</p>
      </div>
    </div>
  );
};

export default PatientDetails;
