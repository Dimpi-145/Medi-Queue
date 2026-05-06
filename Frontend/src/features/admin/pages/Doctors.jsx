import React, { useState, useEffect } from "react";
import { getDoctors, createDoctor } from "../services/api";

import {
  UserPlus,
  Stethoscope,
  Upload,
  Eye,
  BadgeCheck,
  ShieldAlert,
} from "lucide-react";

import "./Doctors.scss";

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    specialization: "",
    degreeFile: null,
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

  // ================= FILE =================
  const handleFileUpload = (e) => {
    setFormData({
      ...formData,
      degreeFile: e.target.files[0],
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
        password: "",
        specialization: "",
        degreeFile: null,
      });

      setShowForm(false);

      fetchDoctors();

    } catch (error) {
      console.error("Error creating doctor:", error);
    }
  };

  return (
    <div className="doctors-page">

      {/* ================= TOOLBAR ================= */}
      <div className="doctors-toolbar">

        <div>
          <h2>Doctor Management</h2>

          <p>
            Manage hospital doctors and department assignments
          </p>
        </div>

        <button
          className="btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          <UserPlus size={18} />

          {showForm ? "Close Form" : "Add New Doctor"}
        </button>

      </div>

      {/* ================= FORM ================= */}
      {showForm && (
        <div className="doctor-form-card">

          <div className="form-header">

            <div>
              <h3>Register Doctor</h3>

              <p>
                Add a verified doctor to the hospital system
              </p>
            </div>

          </div>

          <form
            className="doctor-form"
            onSubmit={handleSubmit}
          >

            <div className="form-grid">

              {/* NAME */}
              <div className="input-group">

                <label>Doctor Name</label>

                <input
                  type="text"
                  name="username"
                  placeholder="Enter doctor name"
                  value={formData.username}
                  onChange={handleInputChange}
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
                  required
                />

              </div>

              {/* PASSWORD */}
              <div className="input-group">

                <label>Password</label>

                <input
                  type="password"
                  name="password"
                  placeholder="Create password"
                  value={formData.password}
                  onChange={handleInputChange}
                />

              </div>

              {/* SPECIALIZATION */}
              <div className="input-group">

                <label>Specialization</label>

                <select
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">
                    Select Specialization
                  </option>

                  <option value="Cardiology">
                    Cardiology
                  </option>

                  <option value="Dermatology">
                    Dermatology
                  </option>

                  <option value="Emergency Medicine">
                    Emergency Medicine
                  </option>

                  <option value="Family Medicine">
                    Family Medicine
                  </option>

                  <option value="Neurology">
                    Neurology
                  </option>

                  <option value="Orthopedic Surgery">
                    Orthopedic Surgery
                  </option>

                  <option value="Pediatrics">
                    Pediatrics
                  </option>

                  <option value="Radiology">
                    Radiology
                  </option>

                </select>

              </div>

              {/* DEGREE UPLOAD */}
              <div className="input-group full-width">

                <label>
                  Degree / License Verification
                </label>

                <label className="upload-box">

                  <Upload size={20} />

                  <span>
                    {formData.degreeFile
                      ? formData.degreeFile.name
                      : "Upload degree certificate (PDF/Image)"}
                  </span>

                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    hidden
                    onChange={handleFileUpload}
                  />

                </label>

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
              >
                <Stethoscope size={18} />

                Create Doctor
              </button>

            </div>

          </form>

        </div>
      )}

      {/* ================= TABLE ================= */}
      <div className="doctors-table-card">

        <div className="table-header">

          <div>
            <h3>Hospital Doctors</h3>

            <p>
              Total Doctors: {doctors.length}
            </p>
          </div>

        </div>

        <div className="table-wrapper">

          {doctors.length === 0 ? (
            <div className="table-loading">
              No doctors found
            </div>
          ) : (
            <table className="doctors-table">

              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Specialization</th>
                  <th>Verification</th>
                  <th>Degree</th>
                </tr>
              </thead>

              <tbody>

                {doctors.map((doc) => (
                  <tr key={doc._id || doc.id}>

                    <td>
                      <div className="doctor-cell">

                        <div className="doctor-avatar">
                          {doc.username?.charAt(0)}
                        </div>

                        <div>
                          <strong>
                            {doc.username}
                          </strong>

                          <span>
                            Hospital Doctor
                          </span>
                        </div>

                      </div>
                    </td>

                    <td>{doc.email}</td>

                    <td>
                      <span className="specialization-badge">
                        {doc.specialization}
                      </span>
                    </td>

                    {/* VERIFICATION */}
                    <td>
                      <span className="verification-badge pending">
                        <ShieldAlert size={14} />
                        Pending
                      </span>
                    </td>

                    {/* DEGREE */}
                    <td>

                      <div className="degree-actions">

                        <button className="btn-secondary">
                          <Eye size={15} />
                          View
                        </button>

                        <button className="btn-primary approve-btn">
                          <BadgeCheck size={15} />
                          Approve
                        </button>

                      </div>

                    </td>

                  </tr>
                ))}

              </tbody>

            </table>
          )}

        </div>

      </div>

    </div>
  );
};
export default Doctors;