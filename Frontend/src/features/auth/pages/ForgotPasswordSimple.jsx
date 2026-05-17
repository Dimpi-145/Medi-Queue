import React, { useEffect, useState } from "react";
import "../style/form.scss";
import { Link, useNavigate } from "react-router-dom";
import { getHospitals, resetPassword } from "../services/auth.api";

const ForgotPasswordSimple = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    role: "patient",
    hospitalId: "",
    identifier: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [hospitals, setHospitals] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (formData.role !== "doctor") {
      return;
    }

    let isActive = true;

    getHospitals()
      .then((data) => {
        const nextHospitals = Array.isArray(data)
          ? data
          : Array.isArray(data?.hospitals)
            ? data.hospitals
            : Array.isArray(data?.data)
              ? data.data
              : [];

        if (isActive) {
          setHospitals(nextHospitals);
        }
      })
      .catch(() => {
        if (isActive) {
          setHospitals([]);
        }
      });

    return () => {
      isActive = false;
    };
  }, [formData.role]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "role" ? { hospitalId: "" } : {}),
    }));

    if (name === "role" && value !== "doctor") {
      setHospitals([]);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const identifier = formData.identifier.trim();
    const newPassword = formData.newPassword.trim();

    if (!identifier || !newPassword || !formData.confirmPassword) {
      setError("Please fill all required fields");
      return;
    }

    if (formData.role === "doctor" && !formData.hospitalId) {
      setError("Please select a hospital");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== formData.confirmPassword.trim()) {
      setError("Passwords do not match");
      return;
    }

    try {
      setSubmitting(true);
      const response = await resetPassword({
        role: formData.role,
        hospitalId: formData.role === "doctor" ? formData.hospitalId : null,
        identifier,
        newPassword,
      });

      setMessage(response?.message || "Password updated successfully");
      setFormData((prev) => ({
        ...prev,
        identifier: "",
        newPassword: "",
        confirmPassword: "",
      }));

      window.setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-layout">
        <div className="auth-card">
          <h2>Reset Password</h2>
          <p>Choose your account and set a new password</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Role</label>
              <select name="role" value={formData.role} onChange={handleChange}>
                <option value="patient">Patient</option>
                <option value="hospital">Hospital</option>
                <option value="doctor">Doctor</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {formData.role === "doctor" && (
              <div className="form-group">
                <label>Hospital</label>
                <select
                  name="hospitalId"
                  value={formData.hospitalId}
                  onChange={handleChange}
                >
                  <option value="">Select Hospital</option>
                  {hospitals.map((hospital) => (
                    <option key={hospital._id} value={hospital._id}>
                      {hospital.name ||
                        hospital.hospitalName ||
                        hospital.username ||
                        "Hospital"}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label>Username or email</label>
              <input
                type="text"
                name="identifier"
                placeholder="Enter username or email"
                value={formData.identifier}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>New password</label>
              <input
                type="password"
                name="newPassword"
                placeholder="Enter new password"
                value={formData.newPassword}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Confirm password</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm new password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>

            {error && <p className="auth-message error">{error}</p>}
            {message && <p className="auth-message success">{message}</p>}

            <button className="auth-btn" disabled={submitting}>
              {submitting ? "Updating..." : "Update Password"}
            </button>
          </form>

          <div className="auth-footer">
            Remembered your password? <Link to="/login">Back to login</Link>
          </div>
        </div>

        <div className="auth-info">
          <h3>Medi-Queue Access</h3>

          <div className="info-item">
            <span>Reset account passwords quickly</span>
          </div>

          <div className="info-item">
            <span>Use your registered username or email</span>
          </div>

          <div className="info-item">
            <span>Return to login once the password changes</span>
          </div>
        </div>
      </div>

      <div className="auth-footer-bar">
        <div className="footer-links">
          <Link to="/terms">Terms of Use</Link>
          <span className="divider">|</span>
          <Link to="/privacy">Privacy Policy</Link>
        </div>

        <div className="footer-copy">
          Copyright 2026 Medi-Queue. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordSimple;
