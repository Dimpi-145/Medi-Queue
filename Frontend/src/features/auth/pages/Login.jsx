import React, { useState } from "react";
import "../style/form.scss";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { login } from "../services/auth.api";

const portalCopy = {
  patient: {
    label: "Patient Portal",
    dashboard: "patient dashboard",
    heroTitle: "Patient Portal",
    heroText:
      "Book appointments, track live queues, and access your secure medical vault anytime, anywhere.",
    accentClass: "patient",
    emblem: "P",
  },
  doctor: {
    label: "Provider Portal",
    dashboard: "doctor dashboard",
    heroTitle: "Provider Portal",
    heroText:
      "Manage your patient queue, write digital prescriptions, and streamline your clinical workflow.",
    accentClass: "doctor",
    emblem: "D",
  },
  admin: {
    label: "Admin Portal",
    dashboard: "admin dashboard",
    heroTitle: "Admin Portal",
    heroText:
      "Oversee appointments, users, and operational flow from a single command center.",
    accentClass: "admin",
    emblem: "A",
  },
};

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { handleLogin } = useAuth();
  const portal = portalCopy[location.state?.portal]
    ? location.state.portal
    : "patient";
  const theme = portalCopy[portal];

  const [formData, setFormData] = useState({
    username: "",
    password: "",
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
      const response = await login(formData.username, formData.password);

      handleLogin(response.user);

      const routes = {
        patient: "/patient-dashboard",
        doctor: "/doctor-dashboard",
        admin: "/admin-dashboard",
      };

      const nextRole =
        response.user?.role === "admin"
          ? "admin"
          : portal === "doctor"
            ? "doctor"
            : "patient";

      navigate(routes[nextRole] || "/");
    } catch (err) {
      console.log("LOGIN ERROR:", err.response?.data);
    }
  };

  return (
    <main
      className={`auth-page login-page portal-${theme.accentClass}`}
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

          <h1>{theme.heroTitle}</h1>
          <p>{theme.heroText}</p>
        </div>

        <p className="brand-footer">© 2026 Qure Healthcare</p>
      </section>

      <section className="auth-form-panel">
        <div className="form-container login-card">
          <div className="form-intro">
            <h2>Welcome back</h2>
            <p>Sign in to access your {theme.dashboard}.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div
              className="portal-toggle"
              role="tablist"
              aria-label="Sign in portal"
            >
              <Link
                to="/login"
                state={{ portal: "patient" }}
                className={`portal-toggle__item ${portal === "patient" ? "is-active" : ""}`}
                role="tab"
                aria-selected={portal === "patient"}
              >
                Patient
              </Link>
              <Link
                to="/login"
                state={{ portal: "doctor" }}
                className={`portal-toggle__item ${portal === "doctor" ? "is-active" : ""}`}
                role="tab"
                aria-selected={portal === "doctor"}
              >
                Doctor
              </Link>
            </div>

            <label className="field-group">
              <span className="field-row">
                <span>Email Address</span>
              </span>
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
                  type="text"
                  name="username"
                  placeholder="name@example.com"
                  value={formData.username}
                  onChange={handleChange}
                  autoComplete="username"
                />
              </span>
              <span className="field-hint">Use your email or username.</span>
            </label>

            <label className="field-group">
              <span className="field-row field-row--split">
                <span>Password</span>
                <span className="field-link">Forgot password?</span>
              </span>
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
                  autoComplete="current-password"
                />
              </span>
            </label>

            <button className="login-submit" type="submit">
              <span>Sign In</span>
              <span className="submit-arrow" aria-hidden="true">
                →
              </span>
            </button>
          </form>

          <p className="signup-line">
            Don't have an account?{" "}
            <Link to="/register" state={{ portal }}>
              Sign up now
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
};

export default Login;
