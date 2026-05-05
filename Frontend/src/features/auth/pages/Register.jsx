import React, { useState } from "react";
import "../style/form.scss";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../services/auth.api";

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
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

    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        termsAccepted: formData.termsAccepted,
      });

      navigate("/login");
    } catch (err) {
      console.error("REGISTER ERROR:", err.response?.data);
    }
  };

  return (
    <div className="auth-container">

      <div className="auth-layout">

        {/* LEFT: FORM */}
        <div className="auth-card">

          <h2>Create Account</h2>
          <p>Register to start using MediQueue</p>

          <form onSubmit={handleSubmit}>

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

            {/* CLEAN CHECKBOX (NO LINKS) */}
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

            <button
              className="auth-btn"
              disabled={!formData.termsAccepted}
            >
              Register
            </button>

          </form>

          <div className="auth-footer">
            Already have an account?{" "}
            <Link to="/login">Login</Link>
          </div>

        </div>

        {/* RIGHT: WHY US */}
        <div className="auth-info">

          <h3>Why choose MediQueue?</h3>

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

      {/* FOOTER (LINKS LIVE HERE NOW) */}
      <div className="auth-footer-bar">

        <div className="footer-links">
          <Link to="/terms">Terms of Use</Link>
          <span className="divider">|</span>
          <Link to="/privacy">Privacy Policy</Link>
        </div>

        <div className="footer-copy">
          © 2026 MediQueue. All rights reserved.
        </div>

      </div>

    </div>
  );
};

export default Register;