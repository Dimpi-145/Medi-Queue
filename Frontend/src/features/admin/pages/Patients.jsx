import React, { useState, useEffect } from "react";
import {
  getPatients,
  createPatient,
  getDoctors,
} from "../services/api";

import {
  UserPlus,
  Stethoscope,
} from "lucide-react";

import "./Patients.scss";

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    age: "",
    gender: "",
    phone: "",
    doctorId: "",
  });

  // ================= FETCH PATIENTS =================
  const fetchPatients = async () => {
    try {
      setLoading(true);

      const res = await getPatients();

      setPatients(res.data || []);
    } catch (err) {
      console.error("Error fetching patients:", err);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  // ================= FETCH DOCTORS =================
  const fetchDoctors = async () => {
    try {
      const res = await getDoctors();
      setDoctors(res.data || []);
    } catch (err) {
      console.error("Error fetching doctors:", err);
      setDoctors([]);
    }
  };

  useEffect(() => {
    fetchPatients();
    fetchDoctors();
  }, []);

  // ================= INPUT =================
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      await createPatient(formData);

      setFormData({
        username: "",
        email: "",
        password: "",
        age: "",
        gender: "",
        phone: "",
        doctorId: "",
      });

      setShowForm(false);

      await fetchPatients();
    } catch (err) {
      console.error("Error creating patient:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to create patient"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="patients-page">

      {/* ================= TOOLBAR ================= */}
      <div className="patients-toolbar">

        <div>
          <h2>Patient Registry</h2>

          <p>
            Manage registrations, assignments, and patient records
          </p>
        </div>

        <button
          className="btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          <UserPlus size={18} />

          {showForm ? "Close Form" : "Register Patient"}
        </button>

      </div>

      {/* ================= FORM ================= */}
      {showForm && (
        <div className="patient-form-card">

          <div className="form-header">

            <div>
              <h3>New Walk-In Patient</h3>

              <p>
                Register a patient and assign a consulting doctor
              </p>
            </div>

          </div>

          <form className="patient-form" onSubmit={handleSubmit}>

            {error && (
              <div className="form-error">
                {error}
              </div>
            )}

            <div className="form-grid">

              {/* NAME */}
              <div className="input-group">

                <label>Full Name</label>

                <input
                  type="text"
                  name="username"
                  placeholder="Enter patient name"
                  value={formData.username}
                  onChange={handleInputChange}
                  disabled={submitting}
                  required
                />

              </div>

              {/* EMAIL */}
              <div className="input-group">

                <label>Email Address</label>

                <input
                  type="email"
                  name="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={submitting}
                  required
                />

              </div>

              {/* PASSWORD */}
              <div className="input-group">

                <label>Password</label>

                <input
                  type="password"
                  name="password"
                  placeholder="Create temporary password"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={submitting}
                />

              </div>

              {/* AGE */}
              <div className="input-group">

                <label>Age</label>

                <input
                  type="number"
                  name="age"
                  placeholder="Patient age"
                  value={formData.age}
                  onChange={handleInputChange}
                  disabled={submitting}
                  required
                />

              </div>

              {/* GENDER */}
              <div className="input-group">

                <label>Gender</label>

                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  disabled={submitting}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="others">Other</option>
                </select>

              </div>

              {/* PHONE */}
              <div className="input-group">

                <label>Phone Number</label>

                <input
                  type="text"
                  name="phone"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={submitting}
                />

              </div>

              {/* DOCTOR */}
              <div className="input-group full-width">

                <label>Assign Doctor</label>

                <select
                  name="doctorId"
                  value={formData.doctorId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">
                    Select Consulting Doctor
                  </option>

                  {doctors.map((doc) => (
                    <option
                      key={doc._id || doc.id}
                      value={doc._id || doc.id}
                    >
                      {doc.username || doc.name}
                    </option>
                  ))}

                </select>

              </div>

            </div>

            {/* ACTIONS */}
            <div className="form-actions">

              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
              >
                <Stethoscope size={18} />

                {submitting
                  ? "Registering..."
                  : "Register Patient"}
              </button>

            </div>

          </form>

        </div>
      )}

      {/* ================= TABLE ================= */}
      <div className="patients-table-card">

        <div className="table-header">

          <div>
            <h3>Registered Patients</h3>

            <p>
              Total Patients: {patients.length}
            </p>
          </div>

        </div>

        {loading ? (
          <div className="table-loading">
            Loading patients...
          </div>
        ) : (
          <div className="table-wrapper">

            <table className="patients-table">

              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Email</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Phone</th>
                </tr>
              </thead>

              <tbody>

                {patients.map((p) => (
                  <tr key={p._id}>

                    <td>
                      <div className="patient-cell">

                        <div className="patient-avatar">
                          {p.username?.charAt(0)}
                        </div>

                        <div>
                          <strong>{p.username}</strong>
                          <span>Patient Record</span>
                        </div>

                      </div>
                    </td>

                    <td>{p.email}</td>

                    <td>{p.age || "-"}</td>

                    <td>
                      <span className={`gender-badge ${p.gender}`}>
                        {p.gender}
                      </span>
                    </td>

                    <td>{p.phone || "-"}</td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
};

export default Patients;