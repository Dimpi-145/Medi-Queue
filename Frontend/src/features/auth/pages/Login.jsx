import React, { useState, useEffect } from "react";
import "../style/form.scss";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { login, getHospitals } from "../services/auth.api";

const roleRoutes = {
  patient: "/patient-dashboard",
  doctor: "/doctor-dashboard",
  admin: "/admin-dashboard",
  hospital: "/hospital-dashboard",
};

const defaultDemoCredentials = [];

const legacyDummyCredentialKeys = new Set([
  "patient|patient_demo|patient123",
  "hospital|hospital_demo|hospital123",
  "doctor|doctor_demo|doctor123",
  "admin|admin_demo|admin123",
]);

const sanitizeDemoCredentials = (rawCredentials) => {
  if (!Array.isArray(rawCredentials)) {
    return [];
  }

  return rawCredentials.filter((credential) => {
    if (!credential || typeof credential !== "object") {
      return false;
    }

    const role = String(credential.role || "")
      .toLowerCase()
      .trim();
    const identifier = String(credential.identifier || "").trim();
    const password = String(credential.password || "").trim();

    if (!role || !identifier || !password) {
      return false;
    }

    const key = `${role}|${identifier}|${password}`;
    return !legacyDummyCredentialKeys.has(key);
  });
};

const Login = () => {
  const navigate = useNavigate();
  const { handleLogin } = useAuth();

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
    role: "patient",
    hospitalId: "",
  });

  const [hospitals, setHospitals] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoCredentials, setDemoCredentials] = useState(() => {
    try {
      const saved = localStorage.getItem("demoCredentials");
      if (!saved) {
        return defaultDemoCredentials;
      }

      return sanitizeDemoCredentials(JSON.parse(saved));
    } catch (err) {
      return defaultDemoCredentials;
    }
  });
  const [demoForm, setDemoForm] = useState({
    role: "patient",
    identifier: "",
    password: "",
  });

  const persistDemoCredentials = (nextCredentials) => {
    try {
      localStorage.setItem("demoCredentials", JSON.stringify(nextCredentials));
    } catch (err) {
      // ignore storage errors
    }
  };

  // Fetch hospitals when role changes to doctor
  useEffect(() => {
    if (formData.role === "doctor") {
      setLoadingHospitals(true);
      getHospitals()
        .then((data) => {
          const nextHospitals = Array.isArray(data)
            ? data
            : Array.isArray(data?.hospitals)
              ? data.hospitals
              : Array.isArray(data?.data)
                ? data.data
                : [];

          setHospitals(nextHospitals);
        })
        .catch((err) => {
          console.error("Error fetching hospitals:", err);
          setHospitals([]);
        })
        .finally(() => setLoadingHospitals(false));
    } else {
      setHospitals([]);
      setFormData((prev) => ({ ...prev, hospitalId: "" }));
    }
  }, [formData.role]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleDemoFormChange = (e) => {
    setDemoForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleAddDemoCredential = (e) => {
    e.preventDefault();

    const identifier = demoForm.identifier.trim();
    const password = demoForm.password.trim();

    if (!identifier || !password) {
      return;
    }

    const newCredential = {
      id: Date.now(),
      role: demoForm.role,
      identifier,
      password,
    };

    setDemoCredentials((prev) => {
      const next = [newCredential, ...prev];
      persistDemoCredentials(next);
      return next;
    });
    setDemoForm((prev) => ({
      ...prev,
      identifier: "",
      password: "",
    }));
  };

  const handleUseDemoCredential = (credential) => {
    setFormData({
      role: credential.role,
      identifier: credential.identifier,
      password: credential.password,
    });
    setShowDemoModal(false);
  };

  const handleRemoveDemoCredential = (credentialId) => {
    setDemoCredentials((prev) => {
      const next = prev.filter((item) => item.id !== credentialId);
      persistDemoCredentials(next);
      return next;
    });
  };

  // persist demo credentials so they survive page reloads
  useEffect(() => {
    const sanitized = sanitizeDemoCredentials(demoCredentials);

    if (sanitized.length !== demoCredentials.length) {
      setDemoCredentials(sanitized);
      persistDemoCredentials(sanitized);
      return;
    }

    persistDemoCredentials(sanitized);
  }, [demoCredentials]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.role === "doctor" && !formData.hospitalId) {
      alert("Please select a hospital");
      return;
    }

    try {
      const response = await login(
        formData.identifier.trim(),
        formData.password,
        formData.role,
        formData.role === "doctor" ? formData.hospitalId : null,
      );
      const user = response.user;
      const token = response.token;

      handleLogin(user);

      // 🔥 STORE FOR SOCKET + SESSION
      if (token) {
        localStorage.setItem("token", token);
      }

      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("username", user.username);
      localStorage.setItem("role", user.role);
      localStorage.setItem("userId", user._id);

      console.log("[Login][socket-debug] stored auth", {
        hasToken: Boolean(token),
        userId: user._id,
        role: user.role,
      });

      // optional (only for doctor queue system)
      if (user.role === "doctor") {
        localStorage.setItem("doctorId", user._id);
        if (user.hospitalId) {
          localStorage.setItem("hospitalId", user.hospitalId);
        }
      }

      const normalizedRole = String(user?.role).toLowerCase();
      navigate(roleRoutes[normalizedRole] || "/");
    } catch (err) {
      console.log("LOGIN ERROR:", err.response?.data);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-layout">
        <div className="auth-card">
          <h2>Medi-Queue</h2>
          <p>Sign in to access the hospital management system</p>

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
                  disabled={loadingHospitals}
                >
                  <option value="">
                    {loadingHospitals
                      ? "Loading hospitals..."
                      : "Select Hospital"}
                  </option>
                  {hospitals.map((hospital) => (
                    <option key={hospital._id} value={hospital._id}>
                      {hospital.name || hospital.hospitalName || hospital.username || "Hospital"}
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
              <label>Password</label>
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <button className="auth-btn">Login</button>

            <button
              type="button"
              className="auth-demo-btn"
              onClick={() => setShowDemoModal(true)}
            >
              Use Demo Credentials
            </button>
          </form>

          <div className="auth-footer">
            Don&apos;t have an account? <Link to="/register">Create one</Link>
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

      {showDemoModal && (
        <div
          className="demo-modal-overlay"
          onClick={() => setShowDemoModal(false)}
        >
          <div className="demo-modal" onClick={(e) => e.stopPropagation()}>
            <div className="demo-modal-header">
              <h3>Demo Credentials</h3>
              <button
                type="button"
                className="demo-close-btn"
                onClick={() => setShowDemoModal(false)}
              >
                ×
              </button>
            </div>

            <form className="demo-add-form" onSubmit={handleAddDemoCredential}>
              <div className="demo-form-grid">
                <select
                  name="role"
                  value={demoForm.role}
                  onChange={handleDemoFormChange}
                >
                  <option value="patient">Patient</option>
                  <option value="hospital">Hospital</option>
                  <option value="doctor">Doctor</option>
                  <option value="admin">Admin</option>
                </select>

                <input
                  type="text"
                  name="identifier"
                  placeholder="Username or email"
                  value={demoForm.identifier}
                  onChange={handleDemoFormChange}
                />

                <input
                  type="text"
                  name="password"
                  placeholder="Password"
                  value={demoForm.password}
                  onChange={handleDemoFormChange}
                />
              </div>

              <button type="submit" className="demo-add-btn">
                Add Demo Credential
              </button>
            </form>

            <div className="demo-list">
              {demoCredentials.map((credential) => (
                <div key={credential.id} className="demo-item">
                  <div>
                    <strong>{credential.role}</strong>
                    <p>{credential.identifier}</p>
                  </div>

                  <div className="demo-item-actions">
                    <button
                      type="button"
                      className="demo-use-btn"
                      onClick={() => handleUseDemoCredential(credential)}
                    >
                      Use
                    </button>

                    <button
                      type="button"
                      className="demo-remove-btn"
                      onClick={() => handleRemoveDemoCredential(credential.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
