import React, { useState, useEffect, useContext } from "react";
import {
  MapPin,
  Phone,
  Mail,
  Building2,
  Edit2,
  X,
  Check,
  Copy,
  CheckCircle2,
} from "lucide-react";
import {
  getHospitalProfile,
  updateHospitalProfile,
} from "../../admin/services/api";
import { authContext } from "../../auth/auth.context";
import "./HospitalProfile.scss";

const HospitalProfile = () => {
  const { user } = useContext(authContext);
  const [profile, setProfile] = useState({
    _id: "",
    hospitalName: "",
    email: "",
    phone: "",
    locationUrl: "",
    profileImage: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editData, setEditData] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    fetchHospitalProfile();
  }, []);

  const fetchHospitalProfile = async () => {
    try {
      setIsLoading(true);
      const res = await getHospitalProfile();
      setProfile(res.data);
      setEditData(res.data);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load hospital profile",
      );
      console.error("Error fetching profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setEditData(profile);
    setMessage("");
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(profile);
    setMessage("");
    setError("");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await updateHospitalProfile({
        hospitalName: editData.hospitalName,
        phone: editData.phone,
        locationUrl: editData.locationUrl,
      });

      setProfile(response.data.hospital);
      setIsEditing(false);
      setMessage("Hospital profile updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
      console.error("Error updating profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(profile._id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch (err) {
      console.error("Failed to copy ID:", err);
    }
  };

  const isGoogleMapsUrl = (url) => {
    return url && (url.includes("google.com/maps") || url.includes("goo.gl"));
  };

  if (isLoading && !profile.hospitalName) {
    return (
      <div className="hospital-profile loading">
        Loading hospital profile...
      </div>
    );
  }

  return (
    <div className="hospital-profile">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-header-content">
            <div className="profile-avatar">
              <img
                src={profile.profileImage || "https://via.placeholder.com/80"}
                alt="Hospital"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/80";
                }}
              />
            </div>

            <div className="profile-info">
              <h2>{profile.hospitalName || "Hospital"}</h2>
              <p className="role-badge">Hospital Account</p>
            </div>
          </div>

          {!isEditing && (
            <button
              className="edit-btn"
              onClick={handleEditClick}
              title="Edit hospital profile"
            >
              <Edit2 size={18} />
              Edit
            </button>
          )}
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        {/* UNIQUE ID SECTION */}
        <div className="unique-id-section">
          <div className="id-label">Hospital Unique ID</div>
          <div className="id-container">
            <code className="id-value">{profile._id || "N/A"}</code>
            <button
              className="copy-btn"
              onClick={handleCopyId}
              title={copiedId ? "Copied!" : "Copy ID"}
            >
              {copiedId ? <CheckCircle2 size={16} /> : <Copy size={16} />}
              {copiedId ? "Copied" : "Copy"}
            </button>
          </div>
          <small className="id-hint">
            Use this ID for verification purposes
          </small>
        </div>

        {!isEditing ? (
          <div className="profile-details">
            <div className="detail-row">
              <div className="detail-item">
                <Mail size={18} />
                <div>
                  <label>Email</label>
                  <p>{profile.email}</p>
                </div>
              </div>

              <div className="detail-item">
                <Phone size={18} />
                <div>
                  <label>Phone</label>
                  <p>{profile.phone || "Not provided"}</p>
                </div>
              </div>
            </div>

            <div className="detail-item full-width">
              <MapPin size={18} />
              <div>
                <label>Location URL</label>
                {profile.locationUrl ? (
                  <a
                    href={profile.locationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="location-link"
                  >
                    {isGoogleMapsUrl(profile.locationUrl)
                      ? "View on Google Maps"
                      : profile.locationUrl}
                    <span className="external-icon">↗</span>
                  </a>
                ) : (
                  <p className="no-data">No location URL provided</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="profile-edit-form">
            <div className="form-group">
              <label htmlFor="hospitalName">Hospital Name</label>
              <input
                id="hospitalName"
                type="text"
                name="hospitalName"
                value={editData.hospitalName || ""}
                onChange={handleInputChange}
                placeholder="Enter hospital name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                type="tel"
                name="phone"
                value={editData.phone || ""}
                onChange={handleInputChange}
                placeholder="Enter phone number"
              />
            </div>

            <div className="form-group">
              <label htmlFor="locationUrl">Google Maps Location URL</label>
              <input
                id="locationUrl"
                type="url"
                name="locationUrl"
                value={editData.locationUrl || ""}
                onChange={handleInputChange}
                placeholder="https://maps.google.com/..."
              />
              <small className="help-text">
                Paste the link from Google Maps (share → copy link)
              </small>
            </div>

            <div className="form-actions">
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={isLoading}
              >
                <Check size={16} />
                {isLoading ? "Saving..." : "Save Changes"}
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleCancel}
                disabled={isLoading}
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HospitalProfile;
