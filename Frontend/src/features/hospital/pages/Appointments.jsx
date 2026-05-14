import React, { useState, useEffect } from "react";
import {
  getAppointments,
  bookAppointment,
  getDoctors,
  getPatients,
} from "../services/api";
import { formatTimeWithAMPM } from "../../../utils/timeFormatter";
import "./Appointments.scss";

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    patientId: "",
    doctorId: "",
    date: "",
    timeSlot: "",
  });

  // ================= FETCH =================
  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
    fetchPatients();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getAppointments();
      setAppointments(res.data || []);
    } catch (err) {
      console.log("Error fetching appointments", err);
      setError(
        err.response?.data?.message || err.message || "Unable to load appointments"
      );
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await getDoctors();
      setDoctors(res.data || []);
    } catch (err) {
      console.log("Error fetching doctors", err);
    }
  };


  const fetchPatients = async () => {
  try {
    const res = await getPatients();

    const data = res.data;

    const patientsArray = Array.isArray(data)
      ? data
      : data?.patients || data?.data || [];

    setPatients(patientsArray);

  } catch (err) {
    console.log("Error fetching patients", err);
  }
};

  // ================= INPUT =================
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await bookAppointment(formData);

      setFormData({
        patientId: "",
        doctorId: "",
        date: "",
        timeSlot: "",
      });

      setShowForm(false);
      fetchAppointments();
    } catch (err) {
      console.log("Booking error", err.response?.data || err.message);
    }
  };

  return (
    <div className="appointments">

      <div className="header">
        <h2>Appointment Management</h2>

        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Book Appointment"}
        </button>
      </div>

      {loading && <div className="panel-empty">Loading appointments...</div>}
      {!loading && error && (
        <div className="panel-error">{error}</div>
      )}

      {/* ================= FORM ================= */}
      {showForm && (
        <form onSubmit={handleSubmit} className="form">

          {/* PATIENT */}
          <select name="patientId" value={formData.patientId} onChange={handleChange} required>
            <option value="">Select Patient</option>
            {patients.map((p) => (
              <option key={p._id} value={p._id}>
                {p.username}
              </option>
            ))}
          </select>

          {/* DOCTOR */}
          <select name="doctorId" value={formData.doctorId} onChange={handleChange} required>
            <option value="">Select Doctor</option>
            {doctors.map((doc) => (
              <option key={doc._id} value={doc._id}>
                {doc.username} ({doc.specialization})
              </option>
            ))}
          </select>

          {/* DATE */}
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />

          {/* TIME */}
          <input
            type="time"
            name="timeSlot"
            value={formData.timeSlot}
            onChange={handleChange}
            required
          />
          {formData.timeSlot && (
            <div className="time-preview">
              Formatted: {formatTimeWithAMPM(formData.timeSlot)}
            </div>
          )}

          <button type="submit" className="btn-primary">
            Book Appointment
          </button>
        </form>
      )}

      {/* ================= TABLE ================= */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {appointments.map((a) => (
              <tr key={a._id}>
                <td>{a.patient}</td>
                <td>{a.doctor}</td>
                <td>{new Date(a.date).toLocaleDateString()}</td>
                <td>{formatTimeWithAMPM(a.timeSlot)}</td>
                <td>
                  <span className={`status ${a.status}`}>
                    {a.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default Appointments;