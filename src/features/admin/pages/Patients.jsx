import React, { useState, useEffect } from "react";
import { getPatients, createPatient, getDoctors, getDoctorsByDepartment } from "../services/api";
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

    console.log("📝 Submitting patient form with data:", formData);

    try {
      const response = await createPatient(formData);
      console.log("✅ Patient created successfully:", response.data);

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
      console.error("❌ Error creating patient:", err);
      console.error("📋 Error response:", err.response?.data);
      setError(err.response?.data?.message || err.message || "Failed to create patient");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="patients">

      <div className="header">
        <h2>Patient Management</h2>

        <button
          className="btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "Add New Patient"}
        </button>
      </div>

      {/* ================= FORM ================= */}
      {showForm && (
        <form className="form" onSubmit={handleSubmit}>

          {error && <p style={{ color: "red", marginBottom: "10px" }}>{error}</p>}

          <input
            type="text"
            name="username"
            placeholder="Name"
            value={formData.username}
            onChange={handleInputChange}
            disabled={submitting}
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
            disabled={submitting}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password (min 6 chars, optional)"
            value={formData.password}
            onChange={handleInputChange}
            disabled={submitting}
          />

          <input
            type="number"
            name="age"
            placeholder="Age"
            value={formData.age}
            onChange={handleInputChange}
            disabled={submitting}
            required
          />

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

          <input
            type="text"
            name="phone"
            placeholder="Phone"
            value={formData.phone}
            onChange={handleInputChange}
            disabled={submitting}
          />

          {/* DOCTORS DROPDOWN */}
          <select
            name="doctorId"
            value={formData.doctorId}
            onChange={handleInputChange}
            disabled={submitting}
          >
            <option value="">Assign Doctor</option>

            {doctors.map((doc) => (
              <option key={doc._id} value={doc._id}>
                {doc.username || doc.name}
              </option>
            ))}
          </select>

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Creating..." : "Register Patient"}
          </button>

        </form>
      )}

      {/* ================= TABLE ================= */}
      <div className="table-container">

        {loading ? (
          <p>Loading patients...</p>
        ) : (
          <table className="table">

            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Age</th>
                <th>Gender</th>
                <th>Phone</th>
              </tr>
            </thead>

            <tbody>
              {patients.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.email}</td>
                  <td>{p.age}</td>
                  <td>{p.gender}</td>
                  <td>{p.phone}</td>
                </tr>
              ))}
            </tbody>

          </table>
        )}

      </div>

    </div>
  );
};

export default Patients;