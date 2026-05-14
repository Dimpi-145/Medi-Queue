import React, { useRef, useState } from "react";
import "../style/form.scss";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { login } from "../services/auth.api";

const Login = () => {
  const navigate = useNavigate();
  const { handleLogin } = useAuth();

  const [formData, setFormData] = useState({
    role: "patient",
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);

  const formRef = useRef(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formRef.current && !formRef.current.reportValidity()) {
      return;
    }

    setError(null);

    try {
      const response = await login(
        formData.username,
        formData.password,
        formData.role,
      );

      const user = response.user;
      const token = response.token;

      if (formData.role && formData.role !== user.role) {
        setError("Selected role does not match account role");
        return;
      }

      handleLogin(user);

      if (token) {
        localStorage.setItem("token", token);
      }

      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("username", user.username);
      localStorage.setItem("role", user.role);
      localStorage.setItem("userId", user._id);

      if (user.role === "doctor") {
        localStorage.setItem("doctorId", user._id);
      }

      const routes = {
        doctor: "/doctor-dashboard",
        patient: "/patient-dashboard",
        admin: "/admin-dashboard",
        hospital: "/hospital-dashboard",
      };

      const normalizedRole = user?.role?.toLowerCase().trim();
      navigate(routes[normalizedRole] || "/");
    } catch (err) {
      console.log("LOGIN ERROR:", err.response?.data);
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Welcome Back</h2>
        <p>Login to continue to MediQueue</p>

        <form ref={formRef} onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
              <option value="admin">Admin</option>
              <option value="hospital">Hospital</option>
            </select>
          </div>

          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              placeholder="Enter username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />

              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((value) => !value)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
            <button className="auth-btn">Login</button>

            <button
              type="button"
              className="auth-btn"
              onClick={() => navigate("/demo-login")}
            >
              Use Demo Credentials
            </button>
          </div>

          {error && (
            <div style={{ color: "var(--danger, #c00)", marginTop: 8 }}>
              {error}
            </div>
          )}
        </form>

        <div className="auth-footer">
          Don&apos;t have an account? <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
