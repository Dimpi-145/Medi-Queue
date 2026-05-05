import React, { useState, useEffect } from "react";
import { formatTimeWithAMPM } from "../../../utils/timeFormatter";
import { getDoctors } from "../services/appointment.api";
import "./AppointmentForm.scss";

const AppointmentForm = ({ onBook, loading }) => {
  const [department, setDepartment] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [reason, setReason] = useState("");
  const [success, setSuccess] = useState("");

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

      setSuccess("Appointment booked successfully ✅");

      // reset
      setDepartment("");
      setDoctorId("");
      setDate("");
      setTimeSlot("");
      setReason("");

    } catch (err) {
      console.error(err);
      setSuccess("");
    }
  };

  return (
    <div className="booking-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Book Appointment</p>
          <h2>Schedule a Visit</h2>
        </div>
      </div>

      <form className="appointment-form" onSubmit={handleSubmit}>

        {/* ✅ DEPARTMENT */}
        <label>
          Department
          <select
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              setDoctorId(""); // reset doctor when department changes
            }}
          >
            <option value="">Select Department</option>
            <option value="Cardiology">Cardiology</option>
            <option value="Dermatology">Dermatology</option>
            <option value="Neurology">Neurology</option>
            <option value="Orthopedics">Orthopedics</option>
          </select>
        </label>

        {/* ✅ DOCTOR (DYNAMIC) */}
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

        {/* DATE */}
        <label>
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>

        {/* TIME */}
        <label>
          Time Slot
          <div className="time-input-wrapper">
            <input
              type="time"
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
            />
            {timeSlot && (
              <span className="time-format">
                {formatTimeWithAMPM(timeSlot)}
              </span>
            )}
          </div>
        </label>

        {/* REASON */}
        <label>
          Reason
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows="3"
          />
        </label>

        <button
          type="submit"
          className="primary-button"
          disabled={loading}
        >
          {loading ? "Booking..." : "Book Appointment"}
        </button>
      </form>

      {success && <p className="success-note">{success}</p>}
    </div>
  );
};

export default AppointmentForm;