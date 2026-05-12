import React, { useState, useEffect } from "react";
import "./ProfileCard.scss";
import { updateProfile } from "../../auth/services/auth.api";

const ProfileCard = ({
  patient,
  loading,
  appointmentsCount,
  reportsAvailable,
  onBookClick,
  onEditClick,

}) => {
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    username: "",
    email: "",
    age: "",
    gender: "",
    phone: "",
  });

  useEffect(() => {
    setForm({
      username: patient?.username || patient?.name || "",
      email: patient?.email || "",
      age: patient?.age || "",
      gender: patient?.gender || "",
      phone: patient?.phone || "",
    });
  }, [patient]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleSave = async () => {
    try {
      await updateProfile(form);
      setEditMode(false);
    } catch (err) {
      console.error("Failed to update profile", err);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setForm({
      username: patient?.username || patient?.name || "",
      email: patient?.email || "",
      age: patient?.age || "",
      gender: patient?.gender || "",
      phone: patient?.phone || "",
    });
  };
  return (
    <section className="card-panel profile-card">
      {/* HEADER */}
      <div className="profile-header">
        <div>
          <p className="eyebrow">Patient Profile</p>
          <h2>My Health Summary</h2>

          {/* ✅ Clean text-only identity */}

          <h3 className="patient-name">
            {patient?.username || patient?.name || "Patient"}
          </h3>
          <p className="patient-email">
            {patient?.email}
          </p>
        </div>

        <div className="header-actions">
          <button className="book-btn" onClick={onBookClick}>
            Book Appointment
          </button>
          <button className="edit-btn" onClick={onEditClick}>
            ✎ Edit Profile

          </button>
        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="panel-empty">Loading profile...</div>
      ) : (
        <>
          {/* DETAILS */}
          {editMode ? (
            <div className="profile-edit-form">
              <label>
                Name
                <input
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                />
              </label>

              <label>
                Email
                <input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                />
              </label>

              <label>
                Age
                <input name="age" value={form.age} onChange={handleChange} />
              </label>

              <label>
                Gender
                <input
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                />
              </label>

              <label>
                Phone
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                />
              </label>

              <div className="form-actions">
                <button className="save-btn" onClick={handleSave}>
                  Save
                </button>
                <button className="cancel-btn" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="patient-details">
              <div className="detail-card">
                <span>Age</span>
                <strong>{patient?.age || "-"}</strong>
              </div>

              <div className="detail-card">
                <span>Gender</span>
                <strong>{patient?.gender || "-"}</strong>
              </div>

              <div className="detail-card">
                <span>Phone</span>
                <strong>{patient?.phone || "-"}</strong>
              </div>
            </div>
          )}

          {/* METRICS */}
          <div className="metric-grid">
            <div className="metric-card">
              <p>Appointments</p>
              <strong>{appointmentsCount}</strong>
            </div>

            <div className="metric-card">
              <p>Reports</p>
              <strong>{reportsAvailable}</strong>
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default ProfileCard;
