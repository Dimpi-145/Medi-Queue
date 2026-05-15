import React, { useState, useContext } from "react";
import { Mail, Phone, User, Copy, CheckCircle2 } from "lucide-react";
import { authContext } from "../../auth/auth.context";
import "./PatientProfile.scss";

const PatientProfile = () => {
  const { user } = useContext(authContext);
  const [copiedId, setCopiedId] = useState(false);

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

  const patientId = user?._id || user?.id || "N/A";

  return (
    <div className="patient-profile">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-header-content">
            <div className="profile-avatar">
              <User size={40} />
            </div>

            <div className="profile-info">
              <h2>{user?.username || "Patient"}</h2>
              <p className="role-badge">Patient Account</p>
            </div>
          </div>
        </div>

        {/* UNIQUE ID SECTION */}
        <div className="unique-id-section">
          <div className="id-label">Patient Unique ID</div>
          <div className="id-container">
            <code className="id-value">{patientId}</code>
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
          <div className="detail-item">
            <Mail size={18} />
            <div>
              <label>Email</label>
              <p>{user?.email || "Not provided"}</p>
            </div>
          </div>

          <div className="detail-item">
            <Phone size={18} />
            <div>
              <label>Phone</label>
              <p>{user?.phone || "Not provided"}</p>
            </div>
          </div>

          {user?.age && (
            <div className="detail-item">
              <User size={18} />
              <div>
                <label>Age</label>
                <p>{user.age}</p>
              </div>
            </div>
          )}

          {user?.gender && (
            <div className="detail-item">
              <User size={18} />
              <div>
                <label>Gender</label>
                <p>{user.gender}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;
