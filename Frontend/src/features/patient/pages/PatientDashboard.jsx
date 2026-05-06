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

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const openChat = (appointment) => {
    setChatContext({
      appointmentId: appointment.id,
      doctorId: appointment.doctorId,
      doctorName: appointment.doctor,
    });
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    await Promise.all([
      fetchDashboard(),
      fetchAppointments(),
      fetchPrescriptions(),
      fetchReportsCount(),
    ]);
  };

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await getPatientDashboard();
      setPatient(res.data?.patient || null);
      setQueueInfo(res.data?.queueInfo || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const res = await getMyAppointments();
      const formatted = (res.data || []).map((item) => ({
        id: item._id,
        doctor: item.doctorId?.username || "Doctor",
        date: new Date(item.date).toLocaleDateString(),
        time: item.timeSlot,
        status: item.status,
      }));
      setAppointments(formatted);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPrescriptions = async () => {
    try {
      const res = await getMyPrescriptions();
      setPrescriptions(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReportsCount = async () => {
    try {
      const res = await getMyReports();
      setReports(res.data.data || []);
    } catch (err) {
      setReports([]);
    }
  };

  const handleBook = async (formData) => {
    try {
      await bookAppointment(formData);
      setShowModal(false);
      fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const currentQueueNumber = queueInfo?.queueNumber || "-";
  const patientsAhead = queueInfo?.patientsAhead || 0;

  return (
    <div className="patient-dashboard">

      <Navbar patient={patient} loading={loading} onLogout={handleLogout} />

      <div className="dashboard-shell">
        <Sidebar activeItem={activeTab} onSelect={setActiveTab} />

        <main className="dashboard-content">

          {activeTab === "Dashboard" && (
            <ProfileCard
              patient={patient}
              loading={loading}
              appointmentsCount={appointments.length}
              reportsAvailable={reports.length}
              onBookClick={() => setShowModal(true)}
            />
          )}

          {activeTab === "My Appointments" && (
            <AppointmentTable
              appointments={appointments}
              loading={loading}
              onChat={openChat}
            />
          )}

          {activeTab === "Prescriptions" && (
            <PrescriptionList
              prescriptions={prescriptions}
              loading={loading}
              patient={patient}
            />
          )}

          {activeTab === "Reports" && <Report />}

          {activeTab === "History" && <History />}

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

      {chatContext && (
        <ChatBox
          chatContext={chatContext}
          onClose={() => setChatContext(null)}
        />
      )}

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