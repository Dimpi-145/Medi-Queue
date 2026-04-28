import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import PatientQueue from "../components/PatientQueue";
import PatientDetails from "../components/PatientDetails";
import PrescriptionBox from "../components/PrescriptionBox";
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
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [prescriptionText, setPrescriptionText] = useState("");
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQueue(initialQueue);
      setSelectedPatient(initialQueue[0]);
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

  const handleLogout = () => {
    console.log("Logout clicked");
  };

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setPrescriptionText("");
  };

  const handleGeneratePdf = () => {
    if (!selectedPatient) return;

    const prescriptionContent = `Prescription for ${selectedPatient.name}\nAge: ${selectedPatient.age}\nGender: ${selectedPatient.gender}\n\nInstructions:\n${prescriptionText || "No prescription text entered."}`;
    const blob = new Blob([prescriptionContent], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `prescription-${selectedPatient.name.replace(/\s+/g, "_")}.pdf`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleSubmitPrescription = () => {
    if (!selectedPatient) return;
    console.log("Submitted prescription", {
      patient: selectedPatient,
      prescription: prescriptionText,
    });
    alert(`Prescription submitted for ${selectedPatient.name}`);
  };

  const handleNextPatient = () => {
    if (!selectedPatient) return;

    const updatedQueue = queue.map((item) =>
      item.id === selectedPatient.id ? { ...item, status: "completed" } : item
    );

    const nextPatient = updatedQueue.find((item) => item.status === "waiting");

    setQueue(updatedQueue);
    setSelectedPatient(nextPatient || null);
    setPrescriptionText("");
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
        <div className="left-panel">
          <PatientQueue
            queue={activeQueue}
            selectedPatientId={selectedPatient?.id}
            onSelectPatient={handleSelectPatient}
            loading={loadingQueue}
          />
        </div>
        <div className="right-panel">
          <PatientDetails patient={selectedPatient} />
          <PrescriptionBox
            prescriptionText={prescriptionText}
            onTextChange={setPrescriptionText}
            onGenerate={handleGeneratePdf}
            onSubmit={handleSubmitPrescription}
            onNext={handleNextPatient}
            disabled={!selectedPatient}
          />
        </div>
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
