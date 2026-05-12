import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import "./EditProfileModal.scss";

const EditProfileModal = ({ patient, onClose, onSave, loading }) => {
  const [formData, setFormData] = useState({
    username: "",
    age: "",
    gender: "",
    phone: "",
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (patient) {
      setFormData({
        username: patient.username || "",
        age: patient.age || "",
        gender: patient.gender || "",
        phone: patient.phone || "",
      });
    }
  }, [patient]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await onSave(formData);
      toast.success("Profile updated successfully!");
      onClose();
    } catch (error) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Profile</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-profile-form">
          <div className="form-group">
            <label htmlFor="username">Name</label>
            <input
              id="username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your name"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="age">Age</label>
              <input
                id="age"
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="Enter your age"
                min="1"
                max="150"
              />
            </div>

            <div className="form-group">
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="others">Others</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter your phone number"
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-save"
              disabled={submitting || loading}
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
