import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import ProfileCard from "../components/ProfileCard";
import QueueList from "../components/QueueList";
import AppointmentTable from "../components/AppointmentTable";
import PrescriptionList from "../components/PrescriptionList";
import AppointmentForm from "../components/AppointmentForm";
import History from "../components/History";
import Report from "../components/Report";
import ChatBox from "../components/chat/ChatBox";

import { getMyAppointments, bookAppointment } from "../services/appointment.api";
import { getPatientDashboard } from "../services/dashboard.api";
import { getMyPrescriptions } from "../services/prescription.api";
import { getMyReports } from "../services/report.api";

import "../../shared/global.scss";
import "../patientDashboard.scss";

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Dashboard");

  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [reports, setReports] = useState([]);
  const [queueInfo, setQueueInfo] = useState(null);

  const [showModal, setShowModal] = useState(false);

  const [chatContext, setChatContext] = useState(null);

  const openChat = (appointment) => {
    setChatContext({
      appointmentId: appointment.id,
      doctorId: appointment.doctorId,
      doctorName: appointment.doctor,
    });
  };

  // ================= LOGOUT =================
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.clear();
    navigate("/login");
  };
  
  // ================= FETCH ALL DATA =================
  useEffect(() => {
    fetchDashboard();
    fetchAppointments();  
    fetchPrescriptions();
    fetchReportsCount();
  }, []);

  // ================= DASHBOARD =================
  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const res = await getPatientDashboard();

      setPatient(res.data?.patient || null);
      setQueueInfo(res.data?.queueInfo || null);

    } catch (err) {
      console.error("Dashboard Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ================= APPOINTMENTS =================
  const fetchAppointments = async () => {
    try {
      const res = await getMyAppointments(); // ✅ using service

      const formatted = (res.data || []).map((item) => ({
        id: item._id,
        doctor: item.doctorId?.username || "Doctor",
        date: new Date(item.date).toLocaleDateString(),
        time: item.timeSlot,
        status: item.status,
      }));

      setAppointments(formatted);

    } catch (err) {
      console.error("Appointments Error:", err);
    }
  };

  // ================= PRESCRIPTIONS =================
  const fetchPrescriptions = async () => {
    try {
      const res = await getMyPrescriptions();

      setPrescriptions(res.data || []);
    } catch (err) {
      console.error("Prescription Error:", err);
    }
  };

  // ================= REPORTS COUNT =================
  const fetchReportsCount = async () => {
    try {
      const res = await getMyReports();
      setReports(res.data.data || []);
    } catch (err) {
      console.error("Reports Fetch Error:", err);
      setReports([]);
    }
  };

  // ================= BOOK APPOINTMENT =================
  const handleBook = async (formData) => {
    try {
      await bookAppointment(formData); 

      setShowModal(false);

      fetchAppointments(); 
      fetchDashboard();    

    } catch (err) {
      console.error("Booking Error:", err);
    }
  };

  // ================= DERIVED =================
  const currentQueueNumber = queueInfo?.queueNumber || "-";
  const patientsAhead = queueInfo?.patientsAhead || 0;

  // ================= UI =================
  return (
    <div className="patient-dashboard">

      <Navbar patient={patient} loading={loading} onLogout={handleLogout} />

      <div className="dashboard-shell">

        <Sidebar activeItem={activeTab} onSelect={setActiveTab} />

        <main className="dashboard-content">

          {/* DASHBOARD */}
          {activeTab === "Dashboard" && (
            <ProfileCard
              patient={patient}
              loading={loading}
              appointmentsCount={appointments.length}
              reportsAvailable={reports.length}
              onBookClick={() => setShowModal(true)}
            />
          )}

          {/* APPOINTMENTS */}
          {activeTab === "My Appointments" && (
            <AppointmentTable
              appointments={appointments}
              loading={loading}
            />
          )}

          {/* PRESCRIPTIONS */}
          {activeTab === "Prescriptions" && (
            <PrescriptionList
              prescriptions={prescriptions}
              loading={loading}
              patient={patient}
            />
          )}

          {/* REPORTS */}
          {activeTab === "Reports" && (
            <Report />
          )}

          {/* HISTORY */}
          {activeTab === "History" && (
            <History />
          )}

          {/* QUEUE */}
          {activeTab === "Queue Status" && (
            <QueueList
              queue={[]}
              loading={loading}
              currentQueueNumber={currentQueueNumber}
              patientsAhead={patientsAhead}
            />
          )}

        </main>
      </div>

           {/* CHAT MODAL */}
      {chatContext && (
        <ChatBox
          chatContext={chatContext}
          onClose={() => setChatContext(null)}
        />
      )}

      {/* MODAL */}
      {showModal && (
        <div
          className="appointment-modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <div
            className="appointment-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="appointment-modal-header">
              <h2>Book Appointment</h2>
              <button onClick={() => setShowModal(false)}>×</button>
            </div>

            <AppointmentForm onBook={handleBook} loading={loading} />
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;