import React, { useState, useEffect, useContext } from "react";
import toast from "react-hot-toast";
import {
  getDoctors,
  createDoctor,
  updateDoctorSchedule,
} from "../services/api";
import { initSocket, joinUserRoom, getSocket } from "../../../services/socket";
import { authContext } from "../../auth/auth.context";

import {
  UserPlus,
  Stethoscope,
  Upload,
  Eye,
  BadgeCheck,
  ShieldAlert,
} from "lucide-react";

import "./Doctors.scss";

const departmentOptions = [
  "Cardiology",
  "Dermatology",
  "Neurology",
  "Orthopedics",
];

const Doctors = () => {
  const { user } = useContext(authContext);
  const [doctors, setDoctors] = useState([]);
  const [scheduleModalDoctor, setScheduleModalDoctor] = useState(null);
  const [schedulePayload, setSchedulePayload] = useState({
    weekly: [],
    isActiveToday: false,
    todayStart: "",
    todayEnd: "",
  });
  const [showForm, setShowForm] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    specialization: "",
    degreeFile: null,
  });

  // ================= FETCH DOCTORS =================
  const fetchDoctors = async () => {
    try {
      const res = await getDoctors();

      const doctorsData = Array.isArray(res.data)
        ? res.data
        : res.data?.doctors || [];

      setDoctors(doctorsData);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      setDoctors([]);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  // socket: listen for doctor status updates (from doctor toggling their own status)
  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      const sock = initSocket(token);
      const myId = user?._id || localStorage.getItem("userId");
      if (myId) joinUserRoom(myId);

      const s = getSocket();
      if (!s) return;

      const handler = (payload) => {
        const { doctorId, schedule } = payload || {};
        if (!doctorId) return;
        setDoctors((prev) =>
          prev.map((d) =>
            String(d._id) === String(doctorId) ? { ...d, schedule } : d,
          ),
        );
      };

      s.on("doctorStatusUpdated", handler);

      return () => {
        try {
          s.off("doctorStatusUpdated", handler);
        } catch (e) {}
      };
    } catch (err) {
      console.error("Socket setup error in Doctors page:", err);
    }
  }, [user]);

  const openScheduleModal = (doc) => {
    setScheduleModalDoctor(doc);
    setSchedulePayload(
      doc.schedule || {
        weekly: [],
        isActiveToday: false,
        todayStart: "",
        todayEnd: "",
      },
    );
  };

  const closeScheduleModal = () => {
    setScheduleModalDoctor(null);
    setSchedulePayload({
      weekly: [],
      isActiveToday: false,
      todayStart: "",
      todayEnd: "",
    });
  };

  const saveSchedule = async () => {
    if (!scheduleModalDoctor) return;
    try {
      await updateDoctorSchedule(scheduleModalDoctor._id, {
        schedule: schedulePayload,
      });
      toast.success("Schedule saved");
      closeScheduleModal();
      fetchDoctors();
    } catch (err) {
      console.error("Save schedule error:", err);
      toast.error(err.response?.data?.message || "Failed to save schedule");
    }
  };

  // ================= INPUT CHANGE =================
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // ================= FILE =================
  const handleFileUpload = (e) => {
    setFormData({
      ...formData,
      degreeFile: e.target.files[0],
    });
  };

  // ================= CREATE DOCTOR =================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    const storedUser = (() => {
      try {
        return JSON.parse(localStorage.getItem("user")) || null;
      } catch (error) {
        return null;
      }
    })();

    const hospitalId =
      user?._id ||
      user?.id ||
      storedUser?._id ||
      storedUser?.id ||
      localStorage.getItem("userId");

    if (!hospitalId) {
      setSubmitError("Hospital session not found. Please log in again.");
      return;
    }

    try {
      const doctorData = {
        ...formData,
        hospitalId,
      };
      await createDoctor(doctorData);

      setFormData({
        username: "",
        email: "",
        password: "",
        specialization: "",
        degreeFile: null,
      });

      setShowForm(false);

      fetchDoctors();
    } catch (error) {
      console.error("Error creating doctor:", error);
      setSubmitError(
        error.response?.data?.message ||
          error.message ||
          "Failed to create doctor",
      );
    }
  };

  return (
    <div className="doctors-page">
      {/* ================= TOOLBAR ================= */}
      <div className="doctors-toolbar">
        <div>
          <h2>Doctor Management</h2>

          <p>Manage hospital doctors and department assignments</p>
        </div>

        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          <UserPlus size={18} />

          {showForm ? "Close Form" : "Add New Doctor"}
        </button>
      </div>

      {/* ================= FORM ================= */}
      {showForm && (
        <div className="doctor-form-card">
          <div className="form-header">
            <div>
              <h3>Register Doctor</h3>

              <p>Add a verified doctor to the hospital system</p>
            </div>
          </div>

          <form className="doctor-form" onSubmit={handleSubmit}>
            {submitError && <div className="form-error">{submitError}</div>}

            <div className="form-grid">
              {/* NAME */}
              <div className="input-group">
                <label>Doctor Name</label>

                <input
                  type="text"
                  name="username"
                  placeholder="Enter doctor name"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* EMAIL */}
              <div className="input-group">
                <label>Email Address</label>

                <input
                  type="email"
                  name="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* PASSWORD */}
              <div className="input-group">
                <label>Password</label>

                <input
                  type="password"
                  name="password"
                  placeholder="Create password"
                  value={formData.password}
                  onChange={handleInputChange}
                />
              </div>

              {/* DEPARTMENT */}
              <div className="input-group">
                <label>Department</label>

                <select
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Department</option>

                  {departmentOptions.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
              </div>

              {/* DEGREE UPLOAD */}
              <div className="input-group full-width">
                <label>Degree / License Verification</label>

                <label className="upload-box">
                  <Upload size={20} />

                  <span>
                    {formData.degreeFile
                      ? formData.degreeFile.name
                      : "Upload degree certificate (PDF/Image)"}
                  </span>

                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    hidden
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>

              <button type="submit" className="btn-primary">
                <Stethoscope size={18} />
                Create Doctor
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= TABLE ================= */}
      <div className="doctors-table-card">
        <div className="table-header">
          <div>
            <h3>Hospital Doctors</h3>

            <p>Total Doctors: {doctors.length}</p>
          </div>
        </div>

        <div className="table-wrapper">
          {doctors.length === 0 ? (
            <div className="table-loading">No doctors found</div>
          ) : (
            <table className="doctors-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Specialization</th>
                  <th>Status</th>
                  <th>Verification</th>
                  <th>Degree</th>
                </tr>
              </thead>

              <tbody>
                {doctors.map((doc) => (
                  <tr key={doc._id || doc.id}>
                    <td>
                      <div className="doctor-cell">
                        <div className="doctor-avatar">
                          {doc.username?.charAt(0)}
                        </div>

                        <div>
                          <strong>{doc.username}</strong>

                          <span>Hospital Doctor</span>
                        </div>
                      </div>
                    </td>

                    <td>{doc.email}</td>

                    <td>
                      <span className="specialization-badge">
                        {doc.specialization}
                      </span>
                    </td>

                    {/* VERIFICATION */}
                    <td>
                      <span
                        className={`status-badge ${doc?.schedule?.isActiveToday ? "active" : "inactive"}`}
                      >
                        {doc?.schedule?.isActiveToday ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* DEGREE */}
                    <td>
                      <div className="degree-actions">
                        <button className="btn-secondary">
                          <Eye size={15} />
                          View
                        </button>

                        <button
                          className="btn-primary"
                          onClick={() => openScheduleModal(doc)}
                        >
                          Manage Schedule
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {scheduleModalDoctor && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Schedule for {scheduleModalDoctor.username}</h3>

            {/* Active/Inactive toggle removed per request */}

            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                type="time"
                value={schedulePayload.todayStart || ""}
                onChange={(e) =>
                  setSchedulePayload({
                    ...schedulePayload,
                    todayStart: e.target.value,
                  })
                }
              />
              <input
                type="time"
                value={schedulePayload.todayEnd || ""}
                onChange={(e) =>
                  setSchedulePayload({
                    ...schedulePayload,
                    todayEnd: e.target.value,
                  })
                }
              />
            </div>

            <div className="schedule-day-grid">
              {[
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
              ].map((day) => {
                const existing = (schedulePayload.weekly || []).find(
                  (w) => w.day === day,
                );
                const selected = Boolean(
                  existing && (existing.start || existing.end),
                );
                return (
                  <div key={day} className="schedule-day">
                    <button
                      type="button"
                      className={`day-btn ${selected ? "day-selected" : ""}`}
                      onClick={() => {
                        if (selected) {
                          // remove
                          const nextWeekly = (
                            schedulePayload.weekly || []
                          ).filter((w) => w.day !== day);
                          setSchedulePayload({
                            ...schedulePayload,
                            weekly: nextWeekly,
                          });
                        } else {
                          const nextWeekly = (
                            schedulePayload.weekly || []
                          ).filter((w) => w.day !== day);
                          nextWeekly.push({
                            day,
                            start: schedulePayload.todayStart || "",
                            end: schedulePayload.todayEnd || "",
                          });
                          setSchedulePayload({
                            ...schedulePayload,
                            weekly: nextWeekly,
                          });
                        }
                      }}
                    >
                      {day.slice(0, 3)}
                    </button>

                    {selected && (
                      <div className="day-times">
                        <input
                          type="time"
                          className="time-input"
                          value={existing?.start || ""}
                          onChange={(e) => {
                            const nextWeekly = (
                              schedulePayload.weekly || []
                            ).filter((w) => w.day !== day);
                            nextWeekly.push({
                              day,
                              start: e.target.value,
                              end: existing?.end || "",
                            });
                            setSchedulePayload({
                              ...schedulePayload,
                              weekly: nextWeekly,
                            });
                          }}
                        />
                        <span className="time-sep">—</span>
                        <input
                          type="time"
                          className="time-input"
                          value={existing?.end || ""}
                          onChange={(e) => {
                            const nextWeekly = (
                              schedulePayload.weekly || []
                            ).filter((w) => w.day !== day);
                            nextWeekly.push({
                              day,
                              start: existing?.start || "",
                              end: e.target.value,
                            });
                            setSchedulePayload({
                              ...schedulePayload,
                              weekly: nextWeekly,
                            });
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button className="btn-secondary" onClick={closeScheduleModal}>
                Cancel
              </button>
              <button className="btn-primary" onClick={saveSchedule}>
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Doctors;
