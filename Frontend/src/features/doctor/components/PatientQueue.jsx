import React from "react";
import "./PatientQueue.scss";

const PatientQueue = ({ queue, selectedPatientId, onSelectPatient, loading }) => {
  if (loading) {
    return (
      <div className="queue-card loading-card">
        <div className="loader" />
        <p>Loading queue...</p>
      </div>
    );
  }

  if (!queue.length) {
    return (
      <div className="queue-card empty-card">
        <p>No patients waiting right now.</p>
      </div>
    );
  }

  return (
    <div className="queue-card">
      <div className="card-header">
        <h3>Patient Queue</h3>
        <span>{queue.length} waiting</span>
      </div>

      <div className="queue-list">
        {queue.map((patient) => (
          <button
            key={patient.id}
            className={`queue-item ${selectedPatientId === patient.id ? "selected" : ""}`}
            onClick={() => onSelectPatient(patient)}
          >
            <div className="queue-number">{patient.queueNumber}</div>
            <div className="patient-meta">
              <strong>{patient.name}</strong>
              <span>{patient.age} yrs · {patient.gender}</span>
            </div>
            <div className={`status-badge ${patient.status}`}>
              {patient.status}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PatientQueue;
