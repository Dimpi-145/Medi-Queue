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
        {queue.map((patient) => {
          const patientName =
            patient.patient?.name ||
            patient.patient?.username ||
            patient.patientId?.username ||
            patient.patientId?.name ||
            patient.name ||
            "Unknown";
          const patientAge =
            patient.patient?.age || patient.patientId?.age || patient.age || "--";
          const patientGender =
            patient.patient?.gender || patient.patientId?.gender || patient.gender || "--";
          const patientId = patient.patientId?._id || patient.patientId?.id || patient._id || patient.id;

          return (
            <button
              key={patientId}
              className={`queue-item ${selectedPatientId === patientId ? "selected" : ""}`}
              onClick={() => onSelectPatient(patient)}
            >
              <div className="queue-number">{patient.queueNumber}</div>
              <div className="patient-meta">
                <strong>{patientName}</strong>
                <span>{patientAge} yrs · {patientGender}</span>
              </div>
              <div className={`status-badge ${patient.status}`}>
                {patient.status}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PatientQueue;
