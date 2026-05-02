import React, { useEffect, useState } from "react";
import axios from "axios";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import ProfileCard from "../components/ProfileCard";
import QueueList from "../components/QueueList";
import AppointmentTable from "../components/AppointmentTable";
import PrescriptionList from "../components/PrescriptionList";
import AppointmentForm from "../components/AppointmentForm";
import History from "../components/History";
import Report from "../components/Report";

import { getMyAppointments, bookAppointment } from "../services/appointment.api";

import "../../shared/global.scss";
import "../patientDashboard.scss";

const PatientDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Dashboard");

  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [reports, setReports] = useState([]);
  const [history, setHistory] = useState([]);
  const [queueInfo, setQueueInfo] = useState(null);

  const [showModal, setShowModal] = useState(false);

  // ================= FETCH ALL DATA =================
  useEffect(() => {
    fetchDashboard();
    fetchAppointments();   // ✅ NEW
    fetchPrescriptions();
    fetchReports();
    fetchHistory();
  }, []);

  // ================= DASHBOARD =================
  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const { data } = await axios.get(
        "http://localhost:3000/api/Dashboard/patient",
        { withCredentials: true }
      );

      setPatient(data.patient || null);
      setQueueInfo(data.queueInfo || null);

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
      const res = await axios.get(
        "http://localhost:3000/api/prescriptions/my",
        { withCredentials: true }
      );

      setPrescriptions(res.data || []);
    } catch (err) {
      console.error("Prescription Error:", err);
    }
  };

  // ================= REPORTS =================
  const fetchReports = async () => {
    try {
      const res = await axios.get(
        "http://localhost:3000/api/reports/my",
        { withCredentials: true }
      );

      setReports(res.data || []);
    } catch (err) {
      console.error("Reports Error:", err);
    }
  };

  // ================= HISTORY =================
  const fetchHistory = async () => {
    try {
      const res = await axios.get(
        "http://localhost:3000/api/history/my",
        { withCredentials: true }
      );

      setHistory(res.data || []);
    } catch (err) {
      console.error("History Error:", err);
    }
  };

  // ================= BOOK APPOINTMENT =================
  const handleBook = async (formData) => {
    try {
      await bookAppointment(formData); // ✅ using service

      setShowModal(false);

      fetchAppointments(); // ✅ refresh appointments
      fetchDashboard();    // optional

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

      <Navbar patient={patient} loading={loading} />

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
            <Report reports={reports} loading={loading} />
          )}

          {/* HISTORY */}
          {activeTab === "History" && (
            <History history={history} loading={loading} />
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