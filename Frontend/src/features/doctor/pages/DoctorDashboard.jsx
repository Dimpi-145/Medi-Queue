import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import PatientQueue from "../components/PatientQueue";
import "../doctorDashboard.scss";

const initialQueue = [
  {
    id: 1,
    name: "Aarav Patel",
    age: 32,
    gender: "Male",
    queueNumber: 5,
    status: "waiting",
    note: "High blood pressure, follow-up on medication.",
  },
  {
    id: 2,
    name: "Nisha Verma",
    age: 27,
    gender: "Female",
    queueNumber: 6,
    status: "called",
    note: "Shortness of breath and seasonal allergies.",
  },
  {
    id: 3,
    name: "Rahul Singh",
    age: 45,
    gender: "Male",
    queueNumber: 7,
    status: "waiting",
    note: "Diabetes monitoring and diet advice.",
  },
];

const appointmentList = [
  { id: 1, patientName: "Aarav Patel", date: "2026-05-01", time: "10:30 AM", status: "Confirmed" },
  { id: 2, patientName: "Nisha Verma", date: "2026-05-01", time: "11:15 AM", status: "Pending" },
  { id: 3, patientName: "Sonal Mehta", date: "2026-05-01", time: "12:00 PM", status: "Completed" },
  { id: 4, patientName: "Rohan Jain", date: "2026-05-01", time: "01:30 PM", status: "Confirmed" },
];

const DoctorDashboard = () => {
  const [activeSection, setActiveSection] = useState("Dashboard");
  const [queue, setQueue] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQueue(initialQueue);
      setSelectedPatientId(initialQueue[0].id);
      setLoadingQueue(false);
    }, 400);

    const appointmentTimer = setTimeout(() => {
      setAppointments(appointmentList);
      setLoadingAppointments(false);
    }, 300);

    return () => {
      clearTimeout(timer);
      clearTimeout(appointmentTimer);
    };
  }, []);

  const navigate = useNavigate();

  const handleLogout = () => {
    console.log("Logout clicked");
  };

  const handleSelectPatient = (patient) => {
    setSelectedPatientId(patient.id);
    navigate(`/doctor-dashboard/patient/${patient.id}`);
  };

  const activeQueue = queue.filter((item) => item.status !== "completed");

  const renderContent = () => {
    if (activeSection === "Appointments") {
      return (
        <div className="appointments-panel">
          <div className="panel-header">
            <h3>Appointments</h3>
            <p>Today's scheduled appointments for Dr. Sharma.</p>
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
                    <td colSpan="4" className="empty-row">Loading appointments...</td>
                  </tr>
                ) : appointments.length ? (
                  appointments.map((item) => (
                    <tr key={item.id}>
                      <td>{item.patientName}</td>
                      <td>{item.date}</td>
                      <td>{item.time}</td>
                      <td>
                        <span className={`status-badge ${item.status.toLowerCase()}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="empty-row">No appointments scheduled.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (activeSection === "History") {
      return (
        <div className="history-panel">
          <div className="panel-header">
            <h3>Patient History</h3>
            <p>Review completed patients and medical notes.</p>
          </div>
          <div className="empty-card">
            <p>History view is currently empty. Completed patients will appear here soon.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="dashboard-grid">
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
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      <div className="doctor-main">
        <Navbar doctorName="Dr. Sharma" onLogout={handleLogout} />
        <div className="doctor-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
