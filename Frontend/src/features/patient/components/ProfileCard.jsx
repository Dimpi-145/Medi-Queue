import React, { useEffect, useState } from "react";
import "./ProfileCard.scss";

const ProfileCard = ({
  patient,
  loading,
  appointmentsCount,
  reportsAvailable,
  onBookClick,
  onSaveProfile,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    age: "",
    gender: "",
    phone: "",
    profileImage: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!patient) {
      return;
    }

    setFormData({
      username: patient.name || "",
      email: patient.email || "",
      age: patient.age ?? "",
      gender: patient.gender || "",
      phone: patient.phone || "",
      profileImage: patient.avatar || "",
    });
  }, [patient]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await onSaveProfile({
        username: formData.username,
        email: formData.email,
        age: formData.age === "" ? null : Number(formData.age),
        gender: formData.gender,
        phone: formData.phone,
        profileImage: formData.profileImage,
      });
      setIsEditing(false);
    } catch (submitError) {
      setError(
        submitError.response?.data?.message || "Unable to update profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card-panel profile-card">
      <div className="profile-header">
        <div>
          <p className="eyebrow">Patient Profile</p>
          <h2>My Health Summary</h2>
        </div>
        <div className="profile-actions">
          <button
            className="book-btn secondary"
            type="button"
            onClick={() => setIsEditing((previous) => !previous)}
          >
            {isEditing ? "Cancel Edit" : "Edit Profile"}
          </button>
          <button className="book-btn" type="button" onClick={onBookClick}>
            Book Appointment
          </button>
        </div>
      </div>
      {loading ? (
        <div className="panel-empty">Loading profile...</div>
      ) : isEditing ? (
        <form className="profile-edit-form" onSubmit={handleSubmit}>
          <div className="patient-info">
            <img
              src={formData.profileImage || patient.avatar}
              alt="Patient avatar"
            />
            <div className="patient-info-fields">
              <label>
                Username
                <input
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                />
              </label>
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </label>
            </div>
          </div>

          <div className="patient-details">
            <label>
              <span>Age</span>
              <input
                name="age"
                type="number"
                value={formData.age}
                onChange={handleChange}
              />
            </label>
            <label>
              <span>Gender</span>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="others">Others</option>
              </select>
            </label>
            <label>
              <span>Phone</span>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </label>
          </div>

          <label className="profile-image-field">
            Profile image URL
            <input
              name="profileImage"
              value={formData.profileImage}
              onChange={handleChange}
            />
          </label>

          {error && <p className="profile-error">{error}</p>}

          <div className="profile-form-actions">
            <button type="submit" className="book-btn" disabled={saving}>
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="patient-info">
            <img src={patient.avatar} alt="Patient avatar" />
            <div>
              <h3>{patient.name}</h3>
              <p>{patient.email}</p>
            </div>
          </div>

          <div className="patient-details">
            <div>
              <span>Age</span>
              <strong>{patient.age}</strong>
            </div>
            <div>
              <span>Gender</span>
              <strong>{patient.gender}</strong>
            </div>
            <div>
              <span>Phone</span>
              <strong>{patient.phone}</strong>
            </div>
          </div>

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

// export default ProfileCard
// import React from 'react'
// import './ProfileCard.scss'

// const ProfileCard = ({ patient, loading, appointmentsCount, reportsAvailable }) => {
//   return (
//     <section className="card-panel profile-card">

//       {/* 🔥 HEADER WITH BUTTON */}
//       <div className="profile-header">
//         <div>
//           <p className="eyebrow">Patient Profile</p>
//           <h2>My Health Summary</h2>
//         </div>

//         <button className="book-btn">
//           Book Appointment
//         </button>
//       </div>

//       {loading ? (
//         <div className="panel-empty">Loading profile...</div>
//       ) : (
//         <>
//           <div className="patient-info">
//             <img src={patient?.avatar} alt="Patient avatar" />
//             <div>
//               <h3>{patient?.name}</h3>
//               <p>{patient?.email}</p>
//             </div>
//           </div>

//           <div className="patient-details">
//             <div>
//               <span>Age</span>
//               <strong>{patient?.age}</strong>
//             </div>
//             <div>
//               <span>Gender</span>
//               <strong>{patient?.gender}</strong>
//             </div>
//             <div>
//               <span>Phone</span>
//               <strong>{patient?.phone}</strong>
//             </div>
//           </div>

//           <div className="metric-grid">
//             <div className="metric-card">
//               <p>Appointments</p>
//               <strong>{appointmentsCount}</strong>
//             </div>
//             <div className="metric-card">
//               <p>Reports</p>
//               <strong>{reportsAvailable}</strong>
//             </div>
//           </div>
//         </>
//       )}
//     </section>
//   )
// }

export default ProfileCard;
