import React from "react";
import "./PatientDetails.scss";

const PatientDetails = ({ patient }) => {
  if (!patient) {
    return (
      <div className="detail-card empty-card">
        <h3>Current patient will appear here</h3>
        <p>
          The active patient is shown automatically when the queue is loaded.
        </p>
      </div>
    );
  }

  const statusValue = String(patient.status || "").toLowerCase();
  const statusLabel =
    statusValue === "approved" ||
    statusValue === "completed" ||
    statusValue === "treated"
      ? "Completed"
      : statusValue
        ? statusValue.charAt(0).toUpperCase() + statusValue.slice(1)
        : "N/A";
  const statusClass =
    statusValue === "approved" ||
    statusValue === "completed" ||
    statusValue === "treated"
      ? "completed"
      : statusValue || "pending";

  return (
    <div className="detail-card">
      <div className="detail-header">
        <div className="patient-avatar">
          {patient.name
            .split(" ")
            .map((part) => part[0])
            .join("")}
        </div>
        <div>
          <h3>{patient.name}</h3>
          <p className="subtle-text">
            {patient.age} years · {patient.gender}
          </p>
        </div>
      </div>

      <div className="detail-grid">
        <div>
          <span className="label">Queue number</span>
          <p>#{patient.queueNumber}</p>
        </div>
        <div>
          <span className="label">Status</span>
          <p className={`status-badge ${statusClass}`}>{statusLabel}</p>
        </div>
      </div>

      <div className="medical-info">
        <span className="label">Medical note</span>
        <p>{patient.note || "No additional medical information available."}</p>
      </div>
    </div>
  );
};

export default PatientDetails;
