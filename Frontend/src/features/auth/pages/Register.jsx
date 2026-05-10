import React, { useState } from "react";
import "../style/form.scss";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { register } from "../services/auth.api";

const portalCopy = {
  patient: {
    label: "Patient Portal",
    heroTitle: "Create an account",
    heroText: "Join QURE as a patient today.",
    panelTitle: "Patient Portal",
    panelText:
      "Book appointments, track live queues, and access your secure medical vault anytime, anywhere.",
    accentClass: "patient",
    emblem: "P",
    formLabel: "Full Name",
    formPlaceholder: "e.g. John Doe",
    linkText: "doctor",
    linkTarget: "doctor",
  },
  doctor: {
    label: "Provider Portal",
    heroTitle: "Create an account",
    heroText: "Join QURE as a doctor today.",
    panelTitle: "Provider Portal",
    panelText:
      "Manage your patient queue, write digital prescriptions, and streamline your clinical workflow.",
    accentClass: "doctor",
    emblem: "D",
    formLabel: "Full Name",
    formPlaceholder: "e.g. Dr. Sarah Smith",
    linkText: "patient",
    linkTarget: "patient",
  },
};

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const portal = portalCopy[location.state?.portal]
    ? location.state.portal
    : "patient";
  const theme = portalCopy[portal];

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    specialization: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: portal,
        specialization:
          portal === "doctor" ? formData.specialization : undefined,
      });

      navigate("/login", { state: { portal } });
    } catch (err) {
      console.error("REGISTER ERROR:", err.response?.data);
    }
  };

  return (
    <main
      className={`auth-page register-page portal-${theme.accentClass}`}
      data-portal={portal}
    >
      <section className="auth-brand-panel">
        <div className="brand-top">
          <div className="brand-logo" aria-label="Qure Healthcare">
            <span className="brand-mark">Q</span>
            <span className="brand-wordmark">URE</span>
          </div>
        </div>

        <div className="brand-center">
          <div className="brand-emblem" aria-hidden="true">
            <span>{theme.emblem}</span>
          </div>

          <h1>{theme.panelTitle}</h1>
          <p>{theme.panelText}</p>
        </div>

        <p className="brand-footer">© 2026 Qure Healthcare</p>
      </section>

      <section className="auth-form-panel">
        <div className="form-container auth-card">
          <div className="form-intro">
            <h2>{theme.heroTitle}</h2>
            <p>{theme.heroText}</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <label className="field-group">
              <span className="field-label">{theme.formLabel}</span>
              <span className="field-shell">
                <span className="field-icon" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21a8 8 0 0 0-16 0" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  type="text"
                  name="username"
                  placeholder={theme.formPlaceholder}
                  value={formData.username}
                  onChange={handleChange}
                  autoComplete="name"
                />
              </span>
            </label>

            {portal === "doctor" && (
              <label className="field-group">
                <span className="field-label">Specialization</span>
                <span className="field-shell">
                  <span className="field-icon" aria-hidden="true">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 2v20" />
                      <path d="M2 12h20" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    name="specialization"
                    placeholder="e.g. Cardiology"
                    value={formData.specialization}
                    onChange={handleChange}
                    autoComplete="off"
                  />
                </span>
              </label>
            )}

            <label className="field-group">
              <span className="field-label">Email Address</span>
              <span className="field-shell">
                <span className="field-icon" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m3 7 9 6 9-6" />
                  </svg>
                </span>
                <input
                  type="email"
                  name="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
              </span>
            </label>

            <label className="field-group">
              <span className="field-label">Password</span>
              <span className="field-shell">
                <span className="field-icon" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="4" y="10" width="16" height="10" rx="2" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>
                </span>
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
              </span>
            </label>

            <button className="login-submit" type="submit">
              <span>Create Account</span>
              <span className="submit-arrow" aria-hidden="true">
                →
              </span>
            </button>
          </form>

          <p className="signup-line">
            Already have an account? <Link to="/login">Sign in instead</Link>
          </p>

          <p className="portal-switch">
            Registering as a {portal}?
            <Link to="/register" state={{ portal: theme.linkTarget }}>
              Switch to {theme.linkText} registration
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
};

export default Register;
