import React from "react";
import "./support.scss";

const Support = () => {
  return (
    <div className="support-page">

      <div className="support-card">

        <h1>Help & Support</h1>

        <p>
          Tell us about your issue and our support team will assist you shortly.
        </p>

        <form className="support-form">

          <input
            type="text"
            placeholder="Enter your name"
          />

          <input
            type="email"
            placeholder="Enter your email"
          />

          <select>
            <option>Select Issue Type</option>
            <option>Appointment Problem</option>
            <option>Login Issue</option>
            <option>Queue Error</option>
            <option>Video Consultation Issue</option>
            <option>Report Upload Issue</option>
            <option>Other</option>
          </select>

          <textarea
            rows="6"
            placeholder="Describe your issue..."
          ></textarea>

          <button type="submit">
            Submit Complaint
          </button>

        </form>

      </div>

    </div>
  );
};

export default Support;