import React, { useState, useEffect } from "react";
import { getDoctors, createDoctor } from "../services/api";
import "./Doctors.scss";

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    specialization: "",
  });

  // ================= FETCH DOCTORS =================
  const fetchDoctors = async () => {
    try {
      const res = await getDoctors();
      const doctorsData = Array.isArray(res.data)
        ? res.data
        : res.data?.doctors || [];
      setDoctors(doctorsData);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      setDoctors([]);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  // ================= INPUT CHANGE =================
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // ================= CREATE DOCTOR =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await createDoctor(formData);

      setFormData({
        username: "",
        email: "",
        specialization: "",
      });

      setShowForm(false);
      fetchDoctors();
    } catch (error) {
      console.error("Error creating doctor:", error);
    }
  };

  return (
    <div className="doctors">

      <div className="header">
        <h2>Doctor Management</h2>

        <button
          className="btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "Add New Doctor"}
        </button>
      </div>

      {/* ================= FORM ================= */}
      {showForm && (
        <form className="form" onSubmit={handleSubmit}>

          <input
            type="text"
            name="username"
            placeholder="Doctor Name"
            value={formData.username}
            onChange={handleInputChange}
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password (min 6 chars, optional)"
            value={formData.password}
            onChange={handleInputChange}
          />

          <select
            name="specialization"
            value={formData.specialization}
            onChange={handleInputChange}
            required
          >
            <option value="">Select Specialization</option>
            <option value="Cardiology">Cardiology</option>
            <option value="Dermatology">Dermatology</option>
            <option value="Emergency Medicine">Emergency Medicine</option>
            <option value="Family Medicine">Family Medicine</option>
            <option value="Gastroenterology">Gastroenterology</option>
            <option value="General Surgery">General Surgery</option>
            <option value="Internal Medicine">Internal Medicine</option>
            <option value="Neurology">Neurology</option>
            <option value="Obstetrics and Gynecology">Obstetrics and Gynecology</option>
            <option value="Ophthalmology">Ophthalmology</option>
            <option value="Orthopedic Surgery">Orthopedic Surgery</option>
            <option value="Pediatrics">Pediatrics</option>
            <option value="Psychiatry">Psychiatry</option>
            <option value="Radiology">Radiology</option>
            <option value="Urology">Urology</option>
          </select>

          <button type="submit" className="btn-primary">
            Create Doctor
          </button>

        </form>
      )}

      {/* ================= TABLE ================= */}
      <div className="table-container">

        {doctors.length === 0 ? (
          <p>No doctors found</p>
        ) : (
          <table className="table">

            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Specialization</th>
              </tr>
            </thead>

            <tbody>
              {doctors.map((doc) => (
                <tr key={doc._id || doc.id}>
                  <td>{doc.username}</td>
                  <td>{doc.email}</td>
                  <td>{doc.specialization}</td>
                </tr>
              ))}
            </tbody>

          </table>
        )}

      </div>

    </div>
  );
};

export default Doctors;