import React from "react";
import "./PrescriptionBox.scss";

const PrescriptionBox = ({
  prescriptionText,
  onTextChange,
  onSubmit,
  onNext,
  disabled,
  queueStatus,
  onQueueStatusChange,
}) => {
  return (
    <div className="prescription-card">
      <div className="prescription-header">
        <div>
          <h3>Prescription</h3>
          <p>Save the note, then move the queue forward.</p>
        </div>
      </div>
      <textarea
        value={prescriptionText}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder="Write your prescription here..."
      />
      <div className="prescription-status-field">
        <label htmlFor="queue-status">Queue status</label>
        <select
          id="queue-status"
          value={queueStatus}
          onChange={(e) => onQueueStatusChange(e.target.value)}
          disabled={disabled}
        >
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      <div className="prescription-actions">
        <button
          className="btn-secondary"
          onClick={onSubmit}
          disabled={disabled}
        >
          Submit Prescription
        </button>
        <button className="btn-success" onClick={onNext} disabled={disabled}>
          Next Patient
        </button>
      </div>
    </div>
  );
};

export default PrescriptionBox;
