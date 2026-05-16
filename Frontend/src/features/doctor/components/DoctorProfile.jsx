import React, { useState, useContext, useEffect } from "react";
import {
  Mail,
  Phone,
  User,
  Briefcase,
  Copy,
  CheckCircle2,
  Building2,
} from "lucide-react";
import { authContext } from "../../auth/auth.context";
import { updateProfile } from "../../auth/services/auth.api";
import axios from "../../../utils/axios";
import "./DoctorProfile.scss";

const DoctorProfile = ({ doctorData, onScheduleUpdate, onProfileUpdate }) => {
  const { user, setUser } = useContext(authContext);
  const [toggling, setToggling] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [hospitalName, setHospitalName] = useState(null);
  const [loadingHospital, setLoadingHospital] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileForm, setProfileForm] = useState({
    email: "",
    phone: "",
    videoUrl: "",
  });
  const profileUser = doctorData || user;
  const doctorId = profileUser?._id || profileUser?.id || "N/A";
  const hospitalIdValue =
    profileUser?.hospitalId?._id || profileUser?.hospitalId || "";
  const profileHospitalName =
    profileUser?.hospitalId?.hospitalName || profileUser?.hospitalName || null;

  useEffect(() => {
    if (profileHospitalName) {
      setHospitalName(profileHospitalName);
      return;
    }

    if (hospitalIdValue) {
      fetchHospitalDetails(hospitalIdValue);
    }
  }, [hospitalIdValue, profileHospitalName]);

  useEffect(() => {
    setProfileForm({
      email: profileUser?.email || "",
      phone: profileUser?.phone || "",
      videoUrl: profileUser?.videoUrl || profileUser?.video_url || "",
    });
  }, [profileUser?.email, profileUser?.phone]);

  const handleEditToggle = () => {
    setProfileError("");
    setEditingProfile((current) => !current);
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleCancelEdit = () => {
    setProfileError("");
    setEditingProfile(false);
    setProfileForm({
      email: profileUser?.email || "",
      phone: profileUser?.phone || "",
    });
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    try {
      setSavingProfile(true);
      setProfileError("");

      const payload = {
        email: profileForm.email.trim(),
        phone: profileForm.phone.trim(),
        videoUrl: profileForm.videoUrl?.trim() || "",
      };

      const response = await updateProfile(payload);
      const updatedUser = response?.user || null;

      if (updatedUser) {
        setUser(updatedUser);
        if (typeof onProfileUpdate === "function") {
          onProfileUpdate(updatedUser);
        }
      }

      setEditingProfile(false);
    } catch (err) {
      console.error("Failed to update profile", err);
      setProfileError(
        err.response?.data?.message || "Unable to update profile right now",
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const fetchHospitalDetails = async (hospitalId) => {
    try {
      setLoadingHospital(true);
      const response = await axios.get(`/admin/hospital-details/${hospitalId}`);
      setHospitalName(response.data?.hospitalName || null);
    } catch (err) {
      console.error("Failed to fetch hospital details:", err);
      setHospitalName(null);
    } finally {
      setLoadingHospital(false);
    }
  };

  const handleCopyId = async () => {
    try {
      const idToCopy = user?._id || user?.id || "";
      if (idToCopy) {
        await navigator.clipboard.writeText(idToCopy);
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy ID:", err);
    }
  };

  return (
    <div className="doctor-profile">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-header-content">
            <div className="profile-avatar">
              <Briefcase size={40} />
            </div>

            <div className="profile-info">
              <h2>{user?.username || "Doctor"}</h2>
              <p className="role-badge">Doctor Account</p>
            </div>
          </div>
          <div className="profile-header-actions">
            <button
              type="button"
              className="edit-profile-btn"
              onClick={editingProfile ? handleCancelEdit : handleEditToggle}
            >
              {editingProfile ? "Cancel Edit" : "Edit Profile"}
            </button>
            <div className="status-toggle">
              <span className="status-label">Status</span>
              <div className="status-control">
                <span
                  className={`status-text ${profileUser?.schedule?.isActiveToday ? "active" : "inactive"}`}
                >
                  {profileUser?.schedule?.isActiveToday ? "Active" : "Inactive"}
                </span>
                <button
                  className={`toggle-btn ${profileUser?.schedule?.isActiveToday ? "on" : "off"}`}
                  onClick={async () => {
                    if (toggling) return;
                    const current = !!profileUser?.schedule?.isActiveToday;
                    const newSchedule = {
                      ...(profileUser?.schedule || {}),
                      isActiveToday: !current,
                    };
                    try {
                      setToggling(true);
                      const res = await axios.put("/auth/profile/schedule", {
                        schedule: newSchedule,
                      });
                      const updatedUser = res.data?.user || null;
                      if (updatedUser) {
                        setUser(updatedUser);
                        if (typeof onScheduleUpdate === "function") {
                          onScheduleUpdate(updatedUser.schedule || newSchedule);
                        }
                      }
                    } catch (err) {
                      console.error("Failed to update schedule", err);
                    } finally {
                      setToggling(false);
                    }
                  }}
                  aria-pressed={!!profileUser?.schedule?.isActiveToday}
                  title={
                    profileUser?.schedule?.isActiveToday
                      ? "Set as inactive"
                      : "Set as active"
                  }
                >
                  <span className="knob" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* UNIQUE ID SECTION */}
        <div className="unique-id-section">
          <div className="id-label">Doctor Unique ID</div>
          <div className="id-container">
            <code className="id-value">{doctorId}</code>
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

        <div className="profile-details">
          {editingProfile ? (
            <form className="profile-edit-form" onSubmit={handleSaveProfile}>
              <div className="detail-item editable-field">
                <Mail size={18} />
                <div>
                  <label htmlFor="doctor-email">Email</label>
                  <input
                    id="doctor-email"
                    name="email"
                    type="email"
                    value={profileForm.email}
                    onChange={handleProfileChange}
                    placeholder="Enter email"
                  />
                </div>
              </div>

              <div className="detail-item editable-field">
                <Phone size={18} />
                <div>
                  <label htmlFor="doctor-phone">Phone</label>
                  <input
                    id="doctor-phone"
                    name="phone"
                    type="tel"
                    value={profileForm.phone}
                    onChange={handleProfileChange}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div className="detail-item editable-field">
                <Briefcase size={18} />
                <div>
                  <label htmlFor="doctor-video">Video Consultation URL</label>
                  <input
                    id="doctor-video"
                    name="videoUrl"
                    type="url"
                    value={profileForm.videoUrl}
                    onChange={handleProfileChange}
                    placeholder="https://zoom.us/... or https://meet.example/..."
                  />
                </div>
              </div>

              {profileError && <p className="profile-error">{profileError}</p>}

              <div className="profile-form-actions">
                <button
                  type="submit"
                  className="save-profile-btn"
                  disabled={savingProfile}
                >
                  {savingProfile ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  className="cancel-profile-btn"
                  onClick={handleCancelEdit}
                  disabled={savingProfile}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="detail-item">
                <Mail size={18} />
                <div>
                  <label>Email</label>
                  <p>{profileUser?.email || "Not provided"}</p>
                </div>
              </div>

              <div className="detail-item">
                <Phone size={18} />
                <div>
                  <label>Phone</label>
                  <p>{profileUser?.phone || "Not provided"}</p>
                </div>
              </div>

              <div className="detail-item">
                <Briefcase size={18} />
                <div>
                  <label>Video Consultation URL</label>
                  {profileUser?.videoUrl || profileUser?.video_url ? (
                    <p>
                      <a
                        href={profileUser?.videoUrl || profileUser?.video_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {profileUser?.videoUrl || profileUser?.video_url}
                      </a>
                    </p>
                  ) : (
                    <p>Not configured</p>
                  )}
                </div>
              </div>
            </>
          )}

          {profileUser?.specialization && (
            <div className="detail-item">
              <Briefcase size={18} />
              <div>
                <label>Specialization</label>
                <p>{profileUser.specialization}</p>
              </div>
            </div>
          )}

          {profileUser?.hospitalId && (
            <div className="detail-item">
              <User size={18} />
              <div>
                <label>Hospital ID</label>
                <p>{hospitalIdValue}</p>
              </div>
            </div>
          )}

          {profileUser?.hospitalId && (
            <div className="detail-item">
              <Building2 size={18} />
              <div>
                <label>Hospital</label>
                <p>
                  {loadingHospital
                    ? "Loading..."
                    : hospitalName || "Hospital information not available"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
