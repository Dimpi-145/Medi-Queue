import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import PatientQueue from "../components/PatientQueue";
import "../doctorDashboard.scss";
import {
  getDoctorDashboard,
  getDoctorAppointments,
  getLiveQueue,
} from "../services/doctor.api";

const DoctorDashboard = () => {
  const [activeSection, setActiveSection] = useState("Dashboard");
  const [queue, setQueue] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    totalWaiting: 0,
    completedToday: 0,
    cancelledToday: 0,
    currentPatient: null,
    nextPatient: null,
  });

  const [loadingQueue, setLoadingQueue] = useState(true);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  const navigate = useNavigate();

  // Socket connection
  const [socket, setSocket] = useState(null);

  // ✅ Fetch data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboardRes, queueRes, appointmentRes] = await Promise.all([
          getDoctorDashboard(),
          getLiveQueue(),
          getDoctorAppointments(),
        ]);

        const doctor = dashboardRes.data?.doctor || null;
        const stats = {
          totalWaiting: dashboardRes.data?.totalWaiting || 0,
          completedToday: dashboardRes.data?.completedToday || 0,
          cancelledToday: dashboardRes.data?.cancelledToday || 0,
          currentPatient: dashboardRes.data?.currentPatient || null,
          nextPatient: dashboardRes.data?.nextPatient || null,
        };

        const queueData =
          queueRes.data?.patients || queueRes.data?.data || queueRes.data || [];
        const appointmentData =
          appointmentRes.data?.data || appointmentRes.data || [];

        setDoctorInfo(doctor);
        setDashboardStats(stats);
        setQueue(Array.isArray(queueData) ? queueData : []);
        setAppointments(Array.isArray(appointmentData) ? appointmentData : []);

        if (Array.isArray(queueData) && queueData.length > 0) {
          setSelectedPatientId(queueData[0].patientId?._id || queueData[0]._id);
        }
      } catch (err) {
        console.error("Error fetching doctor data:", err);
      } finally {
        setLoadingQueue(false);
        setLoadingAppointments(false);
        setLoadingDashboard(false);
      }
    };

    fetchData();

    // Socket connection
    const newSocket = io("http://localhost:3000");
    setSocket(newSocket);

    newSocket.on("queueUpdated", (data) => {
      console.log("Queue updated:", data);
      // Refetch queue
      fetchData();
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleSelectPatient = (patient) => {
    setSelectedPatientId(patient.patientId._id);
    navigate(`/doctor-dashboard/patient/${patient.patientId._id}`);
  };

  // ✅ filter active queue
  const activeQueue = queue.filter(
    (item) => item.status !== "completed"
  );

  // ✅ Render sections
  const renderContent = () => {
    // ================= APPOINTMENTS =================
    if (activeSection === "Appointments") {
      return (
        <div className="appointments-panel">
          <div className="panel-header">
            <h3>Appointments</h3>
            <p>Today's scheduled appointments.</p>
          </div>

          <div className="table-container">
            <table className="appointment-table">
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {loadingAppointments ? (
                  <tr>
                    <td colSpan="4" className="empty-row">
                      Loading appointments...
                    </td>
                  </tr>
                ) : appointments.length > 0 ? (
                  appointments.map((item) => (
                    <tr key={item._id}>
                      <td>
                        {item.patient?.username || item.patient?.name ||
                          item.patientId?.username ||
                          item.patientId?.name ||
                          "N/A"}
                      </td>
                      <td>
                        {item.date
                          ? new Date(item.date).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td>{item.timeSlot || "N/A"}</td>

                      <td>
                        <span
                          className={`status-badge ${
                            item.status?.toLowerCase() || "pending"
                          }`}
                        >
                          {item.status || "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="empty-row">
                      No appointments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    // ================= HISTORY =================
    if (activeSection === "History") {
      return (
        <div className="history-panel">
          <div className="panel-header">
            <h3>Patient History</h3>
            <p>Completed patient records.</p>
          </div>

          <div className="empty-card">
            <p>History feature coming soon.</p>
          </div>
        </div>
      );
    }

    // ================= DASHBOARD =================
    return (
      <div className="dashboard-grid">
        <div className="profile-card">
          <div className="panel-header">
            <h3>Doctor Profile</h3>
            <p>Your personal details and today’s summary.</p>
          </div>
          {loadingDashboard ? (
            <p>Loading doctor info...</p>
          ) : doctorInfo ? (
            <div className="profile-body">
              <strong>{doctorInfo.username}</strong>
              <p>{doctorInfo.email}</p>
              <p>{doctorInfo.specialization || doctorInfo.department || "No specialty set"}</p>
              <p>{doctorInfo.role}</p>
              <div className="stats-row">
                <div>
                  <span>{dashboardStats.totalWaiting}</span>
                  <p>Waiting</p>
                </div>
                <div>
                  <span>{dashboardStats.completedToday}</span>
                  <p>Completed</p>
                </div>
                <div>
                  <span>{dashboardStats.cancelledToday}</span>
                  <p>Cancelled</p>
                </div>
              </div>
            </div>
          ) : (
            <p>No doctor profile found.</p>
          )}
        </div>

        <PatientQueue
          queue={activeQueue}
          selectedPatientId={selectedPatientId}
          onSelectPatient={handleSelectPatient}
          loading={loadingQueue}
        />
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
        <Navbar doctorName={doctorInfo?.username || "Doctor"} onLogout={handleLogout} />

        <div className="doctor-content">{renderContent()}</div>
      </div>
    </div>
  );
};

export default DoctorDashboard;