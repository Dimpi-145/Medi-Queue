import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import DoctorHistory from "../components/DoctorHistory";

import "../doctorDashboard.scss";

import {
  getDoctorDashboard,
  getDoctorAppointments,
  getDoctorHistory,
  getLiveQueue,
  callNextPatient,
  completeCurrent,
} from "../services/doctor.api";

const DoctorDashboard = () => {
  const [activeSection, setActiveSection] = useState("Dashboard");
  const [appointments, setAppointments] = useState([]);
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [queue, setQueue] = useState([]);

  const [dashboardStats, setDashboardStats] = useState({
    totalWaiting: 0,
    completedToday: 0,
    cancelledToday: 0,
    currentPatient: null,
    nextPatient: null,
  });

  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const navigate = useNavigate();

  const socketRef = React.useRef(null);

  // ================= FETCH DATA (IMPORTANT FIX) =================
  const fetchData = useCallback(async (date = selectedDate) => {
    try {
      const [dashboardRes, appointmentRes] = await Promise.all([
        getDoctorDashboard(date),
        getDoctorAppointments(date),
      ]);

      const doctor = dashboardRes.data?.doctor || null;

      const stats = {
        totalWaiting: dashboardRes.data?.totalWaiting || 0,
        completedToday: dashboardRes.data?.completedToday || 0,
        cancelledToday: dashboardRes.data?.cancelledToday || 0,
        currentPatient: dashboardRes.data?.currentPatient || null,
        nextPatient: dashboardRes.data?.nextPatient || null,
      };

      const appointmentData =
        appointmentRes.data?.data ||
        appointmentRes.data ||
        [];

      setDoctorInfo(doctor);
      setDashboardStats(stats);
      setAppointments(Array.isArray(appointmentData) ? appointmentData : []);
    } catch (err) {
      console.error("Error fetching doctor data:", err);
    } finally {
      setLoadingDashboard(false);
      setLoadingAppointments(false);
    }
  }, [selectedDate]);

  const fetchQueue = useCallback(async (date = selectedDate) => {
    try {
      setLoadingQueue(true);
      const queueRes = await getLiveQueue(
        doctorInfo?._id || localStorage.getItem("doctorId"),
        date
      );
      const queueData = queueRes.data?.patients || queueRes.data || [];
      setQueue(Array.isArray(queueData) ? queueData : []);
    } catch (err) {
      console.error("Error fetching live queue:", err);
      setQueue([]);
    } finally {
      setLoadingQueue(false);
    }
  }, [doctorInfo?._id, selectedDate]);

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

  const handleCompleteCurrent = async () => {
    try {
      await completeCurrent(selectedDate);
      fetchData(selectedDate);
      fetchQueue(selectedDate);
    } catch (err) {
      console.error("Error completing current patient:", err);
    }
  };

  const handleDateChange = (event) => {
    const date = event.target.value;
    setSelectedDate(date);
    localStorage.setItem("doctorQueueDate", date);
    fetchData(date);
    fetchQueue(date);
  };

  // ================= INIT =================
  useEffect(() => {
    fetchData();
    fetchQueue();
    fetchHistory();

    const socket = io("http://localhost:3000");
    socketRef.current = socket;

    const joinDoctorRoom = () => {
      const doctorId = localStorage.getItem("doctorId");
      if (doctorId) socket.emit("joinDoctorRoom", doctorId);
    };

    socket.on("connect", joinDoctorRoom);

    socket.on("queueUpdated", (data) => {
      const storedId = localStorage.getItem("doctorId");
      const id = doctorInfo?._id || storedId;
      if (!id) {
        fetchData();
        fetchQueue();
        return;
      }

      if (String(data.doctorId) === String(id)) {
        fetchData();
        fetchQueue();
      }
    });

    socket.on("videoRequestReceived", () => {
      fetchHistory();
    });

    return () => {
      socket.off("connect", joinDoctorRoom);
      socket.off("queueUpdated");
      socket.off("videoRequestReceived");
      socket.disconnect();
    };
  }, [fetchData, fetchQueue, fetchHistory]);

  useEffect(() => {
    if (socketRef.current && doctorInfo?._id) {
      socketRef.current.emit("joinDoctorRoom", doctorInfo._id);
    }
  }, [doctorInfo?._id]);
  // ================= LOGOUT =================
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("doctorId");
    navigate("/login");
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
                onClick={() => navigate(`/doctor-dashboard/patient/${item.patientId?._id}`)}
                style={{ cursor: "pointer", transition: "0.2s" }}
                onMouseEnter={(e) => e.target.parentElement.style.backgroundColor = "#f0f4f8"}
                onMouseLeave={(e) => e.target.parentElement.style.backgroundColor = "transparent"}
              >
                <td>{item.queueNumber}</td>
                <td>{item.patientId?.username || "N/A"}</td>
                <td>{item.patientId?.age ?? "—"}</td>
                <td>
                  <span className={`status-badge ${item.status}`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderContent = () => {
    if (activeSection === "Appointments") {
      return (
        <div className="appointments-panel">
          <div className="panel-header">
            <div>
              <h3>My Appointments</h3>
              <p>Upcoming and past appointment details</p>
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
                      <td>
                        {item.patient?.username ||
                          item.patientId?.username ||
                          "N/A"}
                      </td>

                      <td>
                        {item.date
                          ? new Date(item.date).toLocaleDateString()
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
      );
    }

    if (activeSection === "Queue") {
      return (
        <div className="dashboard-grid">
          <div className="profile-card">
            <div className="panel-header">
              <div>
                <h3>Doctor Queue</h3>
                <p>Manage your current queue and patients waiting.</p>
              </div>
              <div className="date-control">
                <label htmlFor="queue-date">Queue Date</label>
                <input
                  id="queue-date"
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                />
              </div>
            </div>

            <div className="stats-row">
              <div className="stat-box">
                <span>{queue.length}</span>
                <p>Waiting</p>
              </div>
              <div className="stat-box">
                <span>{dashboardStats.currentPatient?.username ? 1 : 0}</span>
                <p>Being Treated</p>
              </div>
              <div className="stat-box">
                <span>{dashboardStats.nextPatient?.username ? dashboardStats.nextPatient.username : "N/A"}</span>
                <p>Next Patient</p>
              </div>
            </div>

            <div className="queue-actions">
              <button
                className="action-btn"
                onClick={handleCompleteCurrent}
                disabled={loadingQueue || !dashboardStats.currentPatient}
              >
                Complete Current Patient
              </button>
            </div>
          </div>

          <div className="appointments-panel">
            <div className="panel-header">
              <div>
                <h3>Waiting Patients</h3>
                <p>Ordered by queue number.</p>
              </div>
            </div>
            {renderQueueList()}
          </div>
        </div>
      );
    }

    if (activeSection === "History") {
      return (
        <DoctorHistory
          socket={socketRef.current}
        />
      );
    }

    return (
      <div className="dashboard-grid">
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

              <div className="doctor-info-grid">
                <div className="info-card">
                  <p className="info-label">Current Patient</p>
                  <strong>{dashboardStats.currentPatient?.username || "None"}</strong>
                </div>
                <div className="info-card">
                  <p className="info-label">Next Patient</p>
                  <strong>{dashboardStats.nextPatient?.username || "None"}</strong>
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
                      <td>
                        {item.patient?.username ||
                          item.patientId?.username ||
                          "N/A"}
                      </td>
                      <td>
                        {item.date
                          ? new Date(item.date).toLocaleDateString()
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