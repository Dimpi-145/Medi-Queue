import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import "../doctorDashboard.scss";

import {
  getDoctorDashboard,
  getDoctorAppointments,
} from "../services/doctor.api";

const DoctorDashboard = () => {
  const [activeSection, setActiveSection] =
    useState("Dashboard");

  const [appointments, setAppointments] =
    useState([]);

  const [doctorInfo, setDoctorInfo] =
    useState(null);

  const [dashboardStats, setDashboardStats] =
    useState({
      totalWaiting: 0,
      completedToday: 0,
      cancelledToday: 0,
      currentPatient: null,
      nextPatient: null,
    });

  const [loadingAppointments, setLoadingAppointments] =
    useState(true);

  const [loadingDashboard, setLoadingDashboard] =
    useState(true);

  const navigate = useNavigate();

  // ================= SOCKET =================
  const [socket, setSocket] = useState(null);

  // ================= FETCH DATA =================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboardRes, appointmentRes] =
          await Promise.all([
            getDoctorDashboard(),
            getDoctorAppointments(),
          ]);

        const doctor =
          dashboardRes.data?.doctor || null;

        const stats = {
          totalWaiting:
            dashboardRes.data?.totalWaiting || 0,

          completedToday:
            dashboardRes.data?.completedToday || 0,

          cancelledToday:
            dashboardRes.data?.cancelledToday || 0,

          currentPatient:
            dashboardRes.data?.currentPatient || null,

          nextPatient:
            dashboardRes.data?.nextPatient || null,
        };

        const appointmentData =
          appointmentRes.data?.data ||
          appointmentRes.data ||
          [];

        setDoctorInfo(doctor);

        setDashboardStats(stats);

        setAppointments(
          Array.isArray(appointmentData)
            ? appointmentData
            : []
        );
      } catch (err) {
        console.error(
          "Error fetching doctor data:",
          err
        );
      } finally {
        setLoadingDashboard(false);
        setLoadingAppointments(false);
      }
    };

    fetchData();

    // ================= SOCKET =================
    const newSocket = io("http://localhost:3000");

    setSocket(newSocket);

    newSocket.on("queueUpdated", () => {
      fetchData();
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // ================= LOGOUT =================
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // ================= CONTENT =================
  const renderContent = () => {
    // ================= APPOINTMENTS =================
    if (activeSection === "Appointments") {
      return (
        <div className="appointments-panel">
          <div className="panel-header">
            <h3>Appointments</h3>
            <p>
              Today's scheduled appointments.
            </p>
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
                    <td
                      colSpan="4"
                      className="empty-row"
                    >
                      Loading appointments...
                    </td>
                  </tr>
                ) : appointments.length > 0 ? (
                  appointments.map((item) => (
                    <tr key={item._id}>
                      <td>
                        {item.patient?.username ||
                          item.patient?.name ||
                          item.patientId?.username ||
                          item.patientId?.name ||
                          "N/A"}
                      </td>

                      <td>
                        {item.date
                          ? new Date(
                              item.date
                            ).toLocaleDateString()
                          : "N/A"}
                      </td>

                      <td>
                        {item.timeSlot || "N/A"}
                      </td>

                      <td>
                        <span
                          className={`status-badge ${
                            item.status?.toLowerCase() ||
                            "pending"
                          }`}
                        >
                          {item.status || "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="empty-row"
                    >
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

            <p>
              Completed consultation records.
            </p>
          </div>

          <div className="empty-card">
            <p>
              <p>Completed patient consultation history will appear here.</p>
            </p>
          </div>
        </div>
      );
    }

    // ================= DASHBOARD =================
    return (
      <div className="dashboard-grid">
        <div className="profile-card">
          <div className="panel-header">
            <div>
              <h3>Doctor Profile</h3>

              <p>
                Professional overview and
                consultation statistics.
              </p>
            </div>
          </div>

          {loadingDashboard ? (
            <p>Loading doctor info...</p>
          ) : doctorInfo ? (
            <div className="profile-body">
              <div className="doctor-profile-top">
                <div className="doctor-avatar">
                  {doctorInfo.username?.charAt(0) ||
                    "D"}
                </div>

                <div>
                  <h2>
                    {doctorInfo.username}
                  </h2>

                  <p>{doctorInfo.email}</p>

                  <span className="specialization-tag">
                    {doctorInfo.specialization ||
                      doctorInfo.department ||
                      "General"}
                  </span>
                </div>
              </div>

              <div className="stats-row">
                <div className="stat-box">
                  <span>
                    {
                      dashboardStats.totalWaiting
                    }
                  </span>

                  <p>Waiting Patients</p>
                </div>

                <div className="stat-box">
                  <span>
                    {
                      dashboardStats.completedToday
                    }
                  </span>

                  <p>Completed Today</p>
                </div>

                <div className="stat-box">
                  <span>
                    {
                      dashboardStats.cancelledToday
                    }
                  </span>

                  <p>Cancelled</p>
                </div>
              </div>

              <div className="doctor-info-grid">
                <div className="info-card">
                  <p className="info-label">
                    Current Patient
                  </p>

                  <strong>
                    {dashboardStats
                      .currentPatient
                      ?.username || "None"}
                  </strong>
                </div>

                <div className="info-card">
                  <p className="info-label">
                    Next Patient
                  </p>

                  <strong>
                    {dashboardStats.nextPatient
                      ?.username || "None"}
                  </strong>
                </div>
              </div>
            </div>
          ) : (
            <p>No doctor profile found.</p>
          )}
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
          doctorName={
            doctorInfo?.username || "Doctor"
          }
          onLogout={handleLogout}
        />

        <div className="doctor-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;