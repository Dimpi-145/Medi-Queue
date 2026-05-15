import React, { useState } from "react";
import "../style/form.scss";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../services/auth.api";

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    role: "patient",
    username: "",
    hospitalName: "",
    email: "",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.termsAccepted) {
      alert("You must accept the Terms and Privacy Policy");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    const isHospital = formData.role === "hospital";
    const displayName = isHospital
      ? formData.hospitalName.trim()
      : formData.username.trim();

    if (!displayName || !formData.email.trim() || !formData.password) {
      alert("Please complete all required fields");
      return;
    }

    try {
      await register({
        username: isHospital ? displayName : formData.username.trim(),
        hospitalName: isHospital ? displayName : undefined,
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
        termsAccepted: formData.termsAccepted,
      });

      navigate("/login");
    } catch (err) {
      console.error("REGISTER ERROR:", err.response?.data);
    }
  };

  const isHospital = formData.role === "hospital";

  return (
    <div className="auth-container">
      <div className="auth-layout">
        <div className="auth-card">
          <h2>Create Account</h2>
          <p>Register to start using Medi-Queue</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Role</label>
              <select name="role" value={formData.role} onChange={handleChange}>
                <option value="patient">Patient</option>
                <option value="hospital">Hospital</option>
              </select>
            </div>

            {isHospital ? (
              <div className="form-group">
                <label>Hospital Name</label>
                <input
                  type="text"
                  name="hospitalName"
                  placeholder="Enter hospital name"
                  value={formData.hospitalName}
                  onChange={handleChange}
                />
              </div>
            ) : (
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  name="username"
                  placeholder="Enter username"
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>
            )}

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                placeholder="Enter email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>

            <div className="form-group checkbox">
              <label>
                <input
                  type="checkbox"
                  name="termsAccepted"
                  checked={formData.termsAccepted}
                  onChange={handleChange}
                />
                I agree to the terms and conditions
              </label>
            </div>

            <button className="auth-btn" disabled={!formData.termsAccepted}>
              Register
            </button>
          </form>

          <div className="auth-footer">
            Already have an account? <Link to="/login">Login</Link>
          </div>
        </div>

        <div className="auth-info">
          <h3>Why choose Medi-Queue?</h3>

          <div className="info-item">
            ⚡ <span>Instant appointment booking</span>
          </div>

          <div className="info-item">
            📊 <span>Real-time queue tracking</span>
          </div>

          <div className="info-item">
            🏥 <span>Efficient patient management</span>
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

export default Register;
