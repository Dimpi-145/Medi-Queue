import React, { useState, useEffect } from "react";
import { formatTimeWithAMPM } from "../../../utils/timeFormatter";
import { getDoctors } from "../services/appointment.api";
import {
  X,
  Calendar,
  Clock3,
  UserRound,
  Stethoscope,
  CheckCircle2,
} from "lucide-react";

import "./AppointmentForm.scss";

const slotOptions = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "02:00",
  "02:30",
  "03:00",
  "03:30",
];

const AppointmentForm = ({ onBook, loading, onClose }) => {
  const [department, setDepartment] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [reason, setReason] = useState("");
  const [success, setSuccess] = useState(false);

  // ================= FETCH DOCTORS =================
  useEffect(() => {
    if (!department) return;

    const fetchDoctors = async () => {
      try {
        const res = await getDoctors(department);
        setDoctors(res.data || []);
      } catch (err) {
        console.error("Doctor Fetch Error:", err);
        setDoctors([]);
      }
    };

    fetchDoctors();
  }, [department]);

  // ================= SELECTED DOCTOR =================
  const selectedDoctor = doctors.find((doc) => doc._id === doctorId);

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!doctorId || !date || !timeSlot) {
      alert("Please fill all required fields");
      return;
    }

    try {
      await onBook({
        doctorId,
        date,
        timeSlot,
        reason,
      });

      setSuccess(true);

      // reset form
      setDepartment("");
      setDoctorId("");
      setDate("");
      setTimeSlot("");
      setReason("");
    } catch (err) {
      console.error("[AppointmentForm] booking error:", err);
      const errorMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to book appointment";
      alert("Error: " + errorMsg);
    }
  };

  // ================= SUCCESS SCREEN =================
  if (success) {
    return (
      <div className="booking-panel success-screen">
        <div className="success-icon">
          <CheckCircle2 size={70} />
        </div>

        <h2>Appointment Confirmed</h2>

        <p>Your appointment has been booked successfully.</p>

        <button className="primary-button" onClick={() => setSuccess(false)}>
          Book Another Appointment
        </button>
      </div>
    );
  }

  return (
    <div className="booking-panel">
      {/* HEADER */}
      <div className="booking-header">
        <div>
          <p className="eyebrow">Book Appointment</p>
          <h2>Schedule a Visit</h2>
        </div>

        <button type="button" className="close-button" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <form className="appointment-form" onSubmit={handleSubmit}>
        {/* DEPARTMENT */}
        <label>
          Department
          <select
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              setDoctorId("");
            }}
          >
            <option value="">Select Department</option>
            <option value="Cardiology">Cardiology</option>
            <option value="Dermatology">Dermatology</option>
            <option value="Neurology">Neurology</option>
            <option value="Orthopedics">Orthopedics</option>
          </select>
        </label>

        {/* DOCTOR */}
        <label>
          Doctor
          <select
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            disabled={!department}
          >
            <option value="">Select Doctor</option>

            {doctors.map((doc) => (
              <option key={doc._id} value={doc._id}>
                {doc.username}
              </option>
            ))}
          </select>
        </label>

        {/* DOCTOR CARD */}
        {selectedDoctor && (
          <div className="doctor-preview-card">
            <div className="doctor-avatar">
              <UserRound size={28} />
            </div>

            <div className="doctor-details">
              <h4>{selectedDoctor.username}</h4>

              <p>
                <Stethoscope size={14} />
                {department}
              </p>

              <span>Available Today</span>
            </div>
          </div>
        )}

        {/* DATE */}
        <label>
          Date
          <div className="input-icon">
            <Calendar size={18} />

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </label>

        {/* SLOT CHIPS */}
        <div className="slot-section">
          <p className="slot-title">
            <Clock3 size={16} />
            Available Time Slots
          </p>

          <div className="slot-grid">
            {slotOptions.map((slot) => (
              <button
                type="button"
                key={slot}
                className={`slot-chip ${timeSlot === slot ? "active" : ""}`}
                onClick={() => setTimeSlot(slot)}
              >
                {formatTimeWithAMPM(slot)}
              </button>
            ))}
          </div>
        </div>

        {/* REASON */}
        <label>
          Reason
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows="3"
            placeholder="Describe symptoms or consultation purpose..."
          />
        </label>

        {/* SUMMARY CARD */}
        {(doctorId || date || timeSlot) && (
          <div className="appointment-summary">
            <h4>Appointment Summary</h4>

            <div className="summary-grid">
              <div>
                <span>Doctor</span>
                <strong>{selectedDoctor?.username || "--"}</strong>
              </div>

              <div>
                <span>Date</span>
                <strong>{date || "--"}</strong>
              </div>

              <div>
                <span>Time</span>
                <strong>
                  {timeSlot ? formatTimeWithAMPM(timeSlot) : "--"}
                </strong>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          className="primary-button submit-button"
          disabled={loading}
        >
          {loading ? "Booking..." : "Confirm Appointment"}
        </button>
      </form>
    </div>
  );
};

export default AppointmentForm;
