import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { initSocket, joinUserRoom } from "../../../services/socket";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import DoctorProfile from "../components/DoctorProfile";
import DoctorHistory from "../components/DoctorHistory";

import { logout as logoutApi } from "../../auth/services/auth.api";

import "../doctorDashboard.scss";

import {
  getDoctorDashboard,
  getDoctorAppointments,
  getDoctorHistory,
  getLiveQueue,
  callNextPatient,
  completeCurrent,
} from "../services/doctor.api";
import PatientDetails from "../components/PatientDetails";
import PrescriptionBox from "../components/PrescriptionBox";
import axios from "../../../utils/axios";
import {
  getDoctorSharedReports,
  requestReport,
  getHospitals,
  getDoctorRequests,
} from "../services/report.api";

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const normalizeQueueStatus = (status = "") => {
  const value = String(status).toLowerCase();
  return value === "approved" || value === "completed" || value === "treated"
    ? "completed"
    : value || "pending";
};

const mapAppointmentToPatient = (appointment) => {
  if (!appointment) {
    return null;
  }

  const patient = appointment.patientId || appointment.patient || {};

  return {
    name: patient.username || patient.name || "N/A",
    age: patient.age || "—",
    gender: patient.gender || "—",
    queueNumber: appointment.queueNumber,
    status: appointment.status,
    note: appointment.note || "",
    appointmentId: appointment._id || appointment.id,
    patientId:
      patient._id || appointment.patientId?._id || appointment.patientId,
  };
};

const DoctorDashboard = () => {
  const [activeSection, setActiveSection] = useState("Dashboard");
  const [appointments, setAppointments] = useState([]);
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [queue, setQueue] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedPatientStatus, setSelectedPatientStatus] = useState("pending");
  const [prescriptionText, setPrescriptionText] = useState("");
  const [prescriptionLoading, setPrescriptionLoading] = useState(false);

  const [dashboardStats, setDashboardStats] = useState({
    totalWaiting: 0,
    completedToday: 0,
    cancelledToday: 0,
    nextPatient: null,
  });

  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sharedReports, setSharedReports] = useState([]);
  const [loadingSharedReports, setLoadingSharedReports] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestTarget, setRequestTarget] = useState("hospital");
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState("");
  const [requestPatientName, setRequestPatientName] = useState("");
  const [requestPatientId, setRequestPatientId] = useState("");
  const [requestReportType, setRequestReportType] = useState("");
  const [requestDescription, setRequestDescription] = useState("");
  const [loadingRequestSubmit, setLoadingRequestSubmit] = useState(false);

  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [queueStatus, setQueueStatus] = useState({
    isActive: false,
    reason: "Loading queue status...",
  });
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());

  const navigate = useNavigate();

  const socketRef = React.useRef(null);

  // ================= FETCH DATA (IMPORTANT FIX) =================
  const fetchData = useCallback(
    async (date = selectedDate) => {
      try {
        setLoadingDashboard(true);

        const dateToUse = date || selectedDate;
        console.log("📊 Fetching doctor dashboard for date:", dateToUse);

        const dashboardRes = await getDoctorDashboard(dateToUse);
        const appointmentRes = await getDoctorAppointments();

        console.log("✅ Dashboard Response:", dashboardRes.data);
        console.log("✅ Appointments Response:", appointmentRes.data);

        const doctor = dashboardRes.data?.doctor || null;

        const stats = {
          totalWaiting: dashboardRes.data?.totalWaiting || 0,
          completedToday: dashboardRes.data?.completedToday || 0,
          cancelledToday: dashboardRes.data?.cancelledToday || 0,
          nextPatient: dashboardRes.data?.nextPatient || null,
        };

        console.log("📈 Dashboard Stats:", stats);

        // Appointments come as array directly from backend
        const appointmentData = Array.isArray(appointmentRes.data)
          ? appointmentRes.data
          : appointmentRes.data?.data || [];

        setDoctorInfo(doctor);
        setDashboardStats(stats);
        setQueueStatus(
          dashboardRes.data?.queueStatus || {
            isActive: false,
            reason: "Queue status unavailable",
          },
        );
        setAppointments(Array.isArray(appointmentData) ? appointmentData : []);

        const activePatient = dashboardRes.data?.currentPatient
          ? mapAppointmentToPatient(dashboardRes.data.currentPatient)
          : dashboardRes.data?.nextPatient
            ? mapAppointmentToPatient(dashboardRes.data.nextPatient)
            : null;

        if (activePatient) {
          setSelectedPatient(activePatient);
          setSelectedPatientStatus("completed");
        }
      } catch (err) {
        console.error("❌ Error fetching doctor data:", err);
        console.error("Error Details:", err.response?.data || err.message);
      } finally {
        setLoadingDashboard(false);
      }
    },
    [selectedDate, selectedPatient],
  );

  const fetchAppointments = useCallback(async () => {
    try {
      setLoadingAppointments(true);
      const res = await getDoctorAppointments();
      const appointmentData = Array.isArray(res.data)
        ? res.data
        : res.data?.data || [];
      setAppointments(Array.isArray(appointmentData) ? appointmentData : []);
    } catch (err) {
      console.error("❌ Error fetching doctor appointments:", err);
      setAppointments([]);
    } finally {
      setLoadingAppointments(false);
    }
  }, []);

  const fetchQueue = useCallback(
    async (date = selectedDate) => {
      try {
        setLoadingQueue(true);
        const doctorId = doctorInfo?._id || localStorage.getItem("doctorId");
        console.log("📋 Fetching queue with:", {
          doctorId,
          date,
          selectedDate,
        });
        const queueRes = await getLiveQueue(doctorId, date);
        const queueData = queueRes.data?.patients || queueRes.data || [];
        setQueueStatus(
          queueRes.data?.queueStatus || {
            isActive: false,
            reason: "Queue status unavailable",
          },
        );
        console.log("✅ Queue fetched:", queueData.length, "patients");
        setQueue(Array.isArray(queueData) ? queueData : []);
      } catch (err) {
        console.error("❌ Error fetching live queue:", err);
        setQueue([]);
      } finally {
        setLoadingQueue(false);
      }
    },
    [doctorInfo?._id, selectedDate],
  );

  const fetchHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const res = await getDoctorHistory();
      setHistory(res.data.consultations || []);
    } catch (err) {
      console.error("Error fetching doctor history:", err);
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const fetchSharedReports = useCallback(async () => {
    try {
      setLoadingSharedReports(true);
      const res = await getDoctorSharedReports();
      setSharedReports(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      console.error("Error fetching shared reports:", err);
      setSharedReports([]);
    } finally {
      setLoadingSharedReports(false);
    }
  }, []);

  const fetchHospitals = useCallback(async () => {
    try {
      const res = await getHospitals();
      setHospitals(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching hospitals:", err);
      setHospitals([]);
    }
  }, []);

  const handleOpenRequestModal = () => {
    setShowRequestModal(true);
    fetchHospitals();
  };

  const handleCloseRequestModal = () => {
    setShowRequestModal(false);
    setRequestTarget("hospital");
    setSelectedHospital("");
    setRequestPatientName("");
    setRequestPatientId("");
    setRequestReportType("");
    setRequestDescription("");
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    try {
      setLoadingRequestSubmit(true);
      const payload = {};
      if (requestTarget === "hospital") payload.hospitalId = selectedHospital;
      if (requestTarget === "patient") {
        if (requestPatientId) payload.patientId = requestPatientId;
        else payload.patientName = requestPatientName;
      }
      if (requestReportType) payload.reportType = requestReportType;
      if (requestDescription) payload.description = requestDescription;

      await requestReport(payload);
      alert("Request sent successfully");
      handleCloseRequestModal();
    } catch (err) {
      console.error("Error creating request:", err);
      alert(err.response?.data?.message || "Failed to send request");
    } finally {
      setLoadingRequestSubmit(false);
    }
  };

  const handleCompleteCurrent = async () => {
    try {
      await completeCurrent(selectedDate);
      fetchData(selectedDate);
      fetchQueue(selectedDate);
    } catch (err) {
      console.error("Error completing current patient:", err);
    }
  };

  // ================= INIT =================
  useEffect(() => {
    fetchData(selectedDate);
    fetchAppointments();
    fetchQueue(selectedDate);
    fetchHistory();
    fetchSharedReports();

    const token = localStorage.getItem("token");
    const socket = initSocket(token);
    socketRef.current = socket;

    socket.on("connect", () => {
      const storedId = localStorage.getItem("doctorId");
      if (storedId) joinUserRoom(storedId);
    });

    socket.on("queueUpdated", (data) => {
      const storedId = localStorage.getItem("doctorId");
      const id = doctorInfo?._id || storedId;
      if (!id) {
        fetchData(selectedDate);
        fetchQueue(selectedDate);
        return;
      }

      if (String(data.doctorId) === String(id)) {
        fetchData(selectedDate);
        fetchAppointments();
        fetchQueue(selectedDate);
      }
    });

    socket.on("videoRequestReceived", () => {
      fetchHistory();
    });

    socket.on("sharedReportReceived", (payload) => {
      console.log("sharedReportReceived", payload);
      fetchSharedReports();
    });

    return () => {
      socket.off("connect");
      socket.off("queueUpdated");
      socket.off("videoRequestReceived");
      socket.off("sharedReportReceived");
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socketRef.current && doctorInfo?._id) {
      joinUserRoom(doctorInfo._id);
      fetchQueue(selectedDate);
    }
  }, [doctorInfo?._id, selectedDate, fetchQueue]);

  const groupedAppointments = useMemo(() => {
    return (appointments || []).reduce((acc, item) => {
      const key = item.date || "No date";
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [appointments]);

  const waitingCount = useMemo(() => {
    return (queue || []).filter((q) => {
      const s = (q.status || "").toLowerCase();
      return s !== "completed" && s !== "approved" && s !== "treated";
    }).length;
  }, [queue]);

  const treatedCount = useMemo(() => {
    return (queue || []).filter((q) => {
      const s = (q.status || "").toLowerCase();
      return s === "completed" || s === "approved" || s === "treated";
    }).length;
  }, [queue]);
  // ================= LOGOUT =================
  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      ["token", "user", "username", "role", "userId", "doctorId"].forEach(
        (key) => localStorage.removeItem(key),
      );
      navigate("/login");
    }
  };

  // ================= UI =================
  const renderQueueList = () => {
    if (loadingQueue) {
      return <p>Loading queue...</p>;
    }

    if (!queue.length) {
      return (
        <div className="empty-card">
          <p>No patients are waiting in the queue right now.</p>
        </div>
      );
    }

    return (
      <div className="table-container">
        <table className="appointment-table">
          <thead>
            <tr>
              <th>Queue #</th>
              <th>Patient</th>
              <th>Age</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {queue.map((item) => (
              <tr
                key={item._id}
                onClick={
                  queueStatus.isActive
                    ? () => {
                        const p = mapAppointmentToPatient(item);
                        setSelectedPatient(p);
                        setSelectedPatientStatus("pending");
                      }
                    : undefined
                }
                style={{
                  cursor: queueStatus.isActive ? "pointer" : "not-allowed",
                  transition: "0.2s",
                  opacity: queueStatus.isActive ? 1 : 0.72,
                }}
              >
                <td>{item.queueNumber}</td>
                <td>{item.patientId?.username || "N/A"}</td>
                <td>{item.patientId?.age ?? "—"}</td>
                <td>
                  {(() => {
                    const s = normalizeQueueStatus(item.status);
                    const cls =
                      s === "completed" ? "completed" : s || "pending";
                    const label =
                      s === "completed"
                        ? "Completed"
                        : s
                          ? s.charAt(0).toUpperCase() + s.slice(1)
                          : "N/A";
                    return (
                      <span className={`status-badge ${cls}`}>{label}</span>
                    );
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderContent = () => {
    const canOperateQueue = !!queueStatus?.isActive;

    if (activeSection === "Appointments") {
      return (
        <div className="appointments-panel">
          <div className="panel-header">
            <div>
              <h3>My Appointments</h3>
              <p>All appointments grouped by appointment date.</p>
            </div>
          </div>

          {loadingAppointments ? (
            <p>Loading...</p>
          ) : appointments.length > 0 ? (
            Object.entries(groupedAppointments)
              .sort(
                (a, b) =>
                  new Date(`${a[0]}T00:00:00`) - new Date(`${b[0]}T00:00:00`),
              )
              .map(([dateLabel, items]) => (
                <div key={dateLabel} className="date-group-card">
                  <div className="date-group-header">
                    <h4>
                      {dateLabel === "No date"
                        ? dateLabel
                        : new Date(`${dateLabel}T00:00:00`).toLocaleDateString(
                            undefined,
                            {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                    </h4>
                    <span>
                      {items.length} appointment{items.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="table-container">
                    <table className="appointment-table">
                      <thead>
                        <tr>
                          <th>Token</th>
                          <th>Patient</th>
                          <th>Time</th>
                          <th>Status</th>
                        </tr>
                      </thead>

                      <tbody>
                        {items.map((item) => (
                          <tr key={item.id || item._id}>
                            <td>{item.queueNumber || "—"}</td>
                            <td>{item.patient?.username || "N/A"}</td>
                            <td>{item.timeSlot || "N/A"}</td>
                            <td>{item.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
          ) : (
            <p>No appointments</p>
          )}
        </div>
      );
    }

    if (activeSection === "Queue") {
      return (
        <div className="dashboard-grid">
          <div className="profile-card">
            <div className="panel-header">
              <div>
                <h3>Doctor Queue</h3>
                <p>Today's queue and patients waiting.</p>
              </div>
              <span
                className={`queue-status-pill ${canOperateQueue ? "active" : "inactive"}`}
              >
                {canOperateQueue ? "Today Active" : "Today Inactive"}
              </span>
            </div>

            {!canOperateQueue && (
              <div className="queue-lock-notice">
                {queueStatus?.reason || "Today's queue is inactive."}
              </div>
            )}

            <div className="stats-row">
              <div className="stat-box">
                <span>{waitingCount}</span>
                <p>Waiting</p>
              </div>
              <div className="stat-box">
                <span>{treatedCount}</span>
                <p>Treated</p>
              </div>
              <div className="stat-box">
                <span>
                  {dashboardStats.nextPatient?.patientId?.username
                    ? dashboardStats.nextPatient.patientId.username
                    : "N/A"}
                </span>
                <p>Next Patient</p>
              </div>
            </div>

            {/* Removed Complete Current Patient button - inline workflow available below */}
          </div>

          <div className="appointments-panel">
            <div className="panel-header">
              <div>
                <h3>Waiting Patients</h3>
                <p>Ordered by queue number.</p>
              </div>
            </div>
            {renderQueueList()}

            <div style={{ marginTop: 18 }}>
              <div className="panel-header">
                <div>
                  <h3>Prescription and Next Patient</h3>
                  <p>
                    Pick a waiting patient, prepare the prescription, then
                    advance the queue.
                  </p>
                </div>
              </div>
              <div className="detail-and-prescription">
                <div style={{ flex: 1 }}>
                  <PatientDetails patient={selectedPatient} />
                </div>
                <div style={{ width: 360 }}>
                  <PrescriptionBox
                    prescriptionText={prescriptionText}
                    onTextChange={setPrescriptionText}
                    queueStatus={selectedPatientStatus}
                    onQueueStatusChange={setSelectedPatientStatus}
                    onSubmit={async () => {
                      try {
                        if (!selectedPatient) {
                          alert("Select a patient first");
                          return;
                        }
                        setPrescriptionLoading(true);
                        await axios.post("/prescriptions/create", {
                          patientId: selectedPatient.patientId,
                          appointmentId: selectedPatient.appointmentId,
                          notes: prescriptionText,
                          medicines: [],
                        });
                        alert(
                          "Prescription sent to the patient prescription section.",
                        );
                        setPrescriptionText("");
                      } catch (err) {
                        console.error("Prescription submit error", err);
                        alert(
                          err.response?.data?.message ||
                            "Failed to submit prescription",
                        );
                      } finally {
                        setPrescriptionLoading(false);
                      }
                    }}
                    onNext={async () => {
                      try {
                        if (!selectedPatient) {
                          alert("Select a patient first");
                          return;
                        }
                        const response = await callNextPatient({
                          date: selectedDate,
                          appointmentId: selectedPatient.appointmentId,
                          currentStatus: selectedPatientStatus,
                        });
                        const nextPatient = response.data?.patient;
                        if (nextPatient) {
                          setSelectedPatient({
                            name: nextPatient.username || "N/A",
                            age: nextPatient.age || "—",
                            gender: nextPatient.gender || "—",
                            queueNumber: response.data?.queueNumber,
                            status: "approved",
                            note: nextPatient.note || "",
                            appointmentId: response.data?.appointmentId,
                            patientId:
                              response.data?.patientId || nextPatient._id,
                          });
                          setSelectedPatientStatus("completed");
                        } else {
                          setSelectedPatient((currentPatient) =>
                            currentPatient
                              ? {
                                  ...currentPatient,
                                  status:
                                    response.data?.currentStatus ||
                                    currentPatient.status,
                                }
                              : currentPatient,
                          );
                          setSelectedPatientStatus(
                            response.data?.currentStatus ||
                              selectedPatientStatus,
                          );
                        }
                        setPrescriptionText("");
                        await fetchQueue(selectedDate);
                        await fetchData(selectedDate);
                      } catch (err) {
                        console.error("Call next failed", err);
                        alert(
                          err.response?.data?.message || "No patients left",
                        );
                      }
                    }}
                    disabled={
                      !canOperateQueue ||
                      prescriptionLoading ||
                      !selectedPatient
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === "History") {
      return <DoctorHistory socket={socketRef.current} />;
    }

    if (activeSection === "Reports") {
      return (
        <div className="appointments-panel">
          <div className="panel-header">
            <div>
              <h3>Received Reports</h3>
              <p>Reports shared by hospitals to your account.</p>
            </div>
            <div>
              <button className="action-btn" onClick={handleOpenRequestModal}>
                Request Report
              </button>
            </div>
          </div>

          {loadingSharedReports ? (
            <p>Loading reports...</p>
          ) : sharedReports.length === 0 ? (
            <p>No shared reports yet.</p>
          ) : (
            <div className="table-container">
              <table className="appointment-table">
                <thead>
                  <tr>
                    <th>Hospital</th>
                    <th>Patient</th>
                    <th>Report Type</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sharedReports.map((item) => (
                    <tr key={item._id}>
                      <td>{item.hospitalId?.hospitalName || "Hospital"}</td>
                      <td>
                        {item.patientId?.username ||
                          item.patientName ||
                          "Unknown"}
                      </td>
                      <td>{item.reportType || "Report"}</td>
                      <td>
                        <span className="status-badge completed">Received</span>
                      </td>
                      <td>
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td>
                        <a
                          href={item.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="action-btn"
                        >
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {showRequestModal && (
            <div className="modal-overlay">
              <div className="modal">
                <h3>Request Report</h3>
                <form onSubmit={handleSubmitRequest}>
                  <div style={{ marginBottom: 8 }}>
                    <label>
                      <input
                        type="radio"
                        name="target"
                        value="hospital"
                        checked={requestTarget === "hospital"}
                        onChange={() => setRequestTarget("hospital")}
                      />
                      Request from Hospital
                    </label>
                    <label style={{ marginLeft: 12 }}>
                      <input
                        type="radio"
                        name="target"
                        value="patient"
                        checked={requestTarget === "patient"}
                        onChange={() => setRequestTarget("patient")}
                      />
                      Request from Patient
                    </label>
                  </div>

                  {requestTarget === "hospital" && (
                    <div style={{ marginBottom: 8 }}>
                      <label>Hospital</label>
                      <select
                        value={selectedHospital}
                        onChange={(e) => setSelectedHospital(e.target.value)}
                      >
                        <option value="">Select hospital</option>
                        {hospitals.map((h) => (
                          <option key={h._id} value={h._id}>
                            {h.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {requestTarget === "patient" && (
                    <div style={{ marginBottom: 8 }}>
                      <label>Patient ID (optional)</label>
                      <input
                        type="text"
                        value={requestPatientId}
                        onChange={(e) => setRequestPatientId(e.target.value)}
                        placeholder="Patient ID (or leave blank to use name)"
                      />
                      <label>Or Patient Name</label>
                      <input
                        type="text"
                        value={requestPatientName}
                        onChange={(e) => setRequestPatientName(e.target.value)}
                        placeholder="Patient username"
                      />
                    </div>
                  )}

                  <div style={{ marginBottom: 8 }}>
                    <label>Report Type</label>
                    <input
                      type="text"
                      value={requestReportType}
                      onChange={(e) => setRequestReportType(e.target.value)}
                      placeholder="e.g. Blood Test"
                    />
                  </div>

                  <div style={{ marginBottom: 8 }}>
                    <label>Notes / Description</label>
                    <textarea
                      value={requestDescription}
                      onChange={(e) => setRequestDescription(e.target.value)}
                      placeholder="Any additional instructions"
                    />
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="submit"
                      className="action-btn"
                      disabled={loadingRequestSubmit}
                    >
                      {loadingRequestSubmit ? "Sending..." : "Send Request"}
                    </button>
                    <button
                      type="button"
                      className="action-btn"
                      onClick={handleCloseRequestModal}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="dashboard-grid">
        <DoctorProfile
          doctorData={doctorInfo}
          onScheduleUpdate={(schedule) => {
            setDoctorInfo((prev) =>
              prev
                ? {
                    ...prev,
                    schedule: { ...(prev.schedule || {}), ...(schedule || {}) },
                  }
                : prev,
            );
          }}
          onProfileUpdate={(updatedUser) => {
            if (updatedUser) {
              setDoctorInfo(updatedUser);
            } else {
              fetchData(selectedDate);
            }
          }}
        />

        <div className="profile-card">
          <div className="panel-header">
            <div>
              <h3>Doctor Profile</h3>
              <p>Overview of your practice activity and today's queue.</p>
            </div>
          </div>

          {loadingDashboard ? (
            <p>Loading...</p>
          ) : doctorInfo ? (
            <>
              <div className="doctor-profile-top">
                <div>
                  <h3>{doctorInfo.username}</h3>
                  <p>{doctorInfo.email}</p>
                  {(doctorInfo.hospitalId?.hospitalName ||
                    doctorInfo.hospitalName) && (
                    <span className="doctor-hospital-name">
                      {doctorInfo.hospitalId?.hospitalName ||
                        doctorInfo.hospitalName}
                    </span>
                  )}
                </div>
                <span className="specialization-tag">
                  {doctorInfo.specialization || "General"}
                </span>
              </div>

              <div className="stats-row">
                <div className="stat-box">
                  <span>{dashboardStats.totalWaiting}</span>
                  <p>Total Waiting</p>
                </div>
                <div className="stat-box">
                  <span>{dashboardStats.completedToday}</span>
                  <p>Completed Today</p>
                </div>
                <div className="stat-box">
                  <span>{dashboardStats.cancelledToday}</span>
                  <p>Cancelled Today</p>
                </div>
              </div>
            </>
          ) : (
            <p>No doctor found</p>
          )}
        </div>

        <div className="appointments-panel">
          <div className="panel-header">
            <div>
              <h3>Upcoming Appointments</h3>
              <p>Review your today's scheduled appointments.</p>
            </div>
          </div>

          <div className="table-container">
            <table className="appointment-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loadingAppointments ? (
                  <tr>
                    <td colSpan="4">Loading...</td>
                  </tr>
                ) : appointments.length > 0 ? (
                  appointments.map((item) => (
                    <tr key={item._id}>
                      <td>{item.patient?.username || "N/A"}</td>
                      <td>
                        {item.date
                          ? new Date(
                              `${item.date}T00:00:00`,
                            ).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td>{item.timeSlot || "N/A"}</td>
                      <td>{item.status}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4">No appointments</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="doctor-dashboard">
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />

      <div className="doctor-main">
        <Navbar
          doctorName={doctorInfo?.username || "Doctor"}
          onLogout={handleLogout}
        />

        <div className="doctor-content">{renderContent()}</div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
