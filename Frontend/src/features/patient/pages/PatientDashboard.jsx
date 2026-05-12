import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import ProfileCard from "../components/ProfileCard";
import EditProfileModal from "../components/EditProfileModal";
import QueueList from "../components/QueueList";
import AppointmentTable from "../components/AppointmentTable";
import PrescriptionList from "../components/PrescriptionList";
import AppointmentForm from "../components/AppointmentForm";
import History from "../components/History";
import Report from "../components/Report";

import API from "../../../utils/axios";
import { getMyAppointments, bookAppointment } from "../services/appointment.api";
import { getPatientDashboard } from "../services/dashboard.api";
import { getMyPrescriptions } from "../services/prescription.api";
import { getMyReports } from "../services/report.api";
import { updateProfile } from "../../auth/services/auth.api";

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
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [queue, setQueue] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [showModal, setShowModal] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const openChat = (appointment) => {
    navigate(`/patient/chat/${appointment.id}`);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (activeAppointment) {
      const dateToUse = activeAppointment.date || selectedDate;
      setSelectedDate(dateToUse);
      fetchQueue(dateToUse);
    }
  }, [activeAppointment]);

  useEffect(() => {
    if (!activeAppointment) {
      return;
    }

    const socket = io("http://localhost:3000");

    socket.on("connect", () => {
      if (activeAppointment.doctorId?._id) {
        socket.emit("joinDoctorRoom", activeAppointment.doctorId._id);
      }
    });

    socket.on("queueUpdated", (data) => {
      if (data.doctorId === activeAppointment.doctorId?._id) {
        fetchQueue(selectedDate);
        fetchDashboard();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [activeAppointment, selectedDate]);

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
      const res = await getPatientDashboard(selectedDate);
      setPatient(res.data?.patient || null);
      setQueueInfo(res.data?.queueInfo || null);
      setActiveAppointment(res.data?.activeAppointment || null);
      if (res.data?.activeAppointment?.date) {
        setSelectedDate(res.data.activeAppointment.date);
      }
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

  const fetchQueue = async (date = selectedDate) => {
    try {
      setLoadingQueue(true);
      const res = await API.get(`/queue/live?date=${date}`);
      const queueData = res.data?.patients || [];
      setQueue(Array.isArray(queueData) ? queueData : []);
    } catch (err) {
      console.error("Queue fetch error:", err);
      setQueue([]);
    } finally {
      setLoadingQueue(false);
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

  const handleEditProfile = async (formData) => {
    try {
      await updateProfile(formData);
      setShowEditProfile(false);
      fetchDashboard();
    } catch (err) {
      console.error(err);
      throw err;
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
              onEditClick={() => setShowEditProfile(true)}
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

          {activeTab === "History" && <History onChat={openChat} />}

          {activeTab === "Queue Status" && (
            <>
              <div className="queue-header-row">
                <div>
                  <h2>Live Queue</h2>
                  <p>Track your queue in real time for the selected date.</p>
                </div>
                <div className="date-control">
                  <label htmlFor="patient-queue-date">Date</label>
                  <input
                    id="patient-queue-date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      fetchQueue(e.target.value);
                    }}
                  />
                </div>
              </div>

              <QueueList
                queue={queue}
                loading={loadingQueue}
                currentQueueNumber={currentQueueNumber}
                patientsAhead={patientsAhead}
              />
            </>
          )}
        </main>
      </div>

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

      {showEditProfile && (
        <EditProfileModal
          patient={patient}
          onClose={() => setShowEditProfile(false)}
          onSave={handleEditProfile}
          loading={loading}
        />
      )}
    </div>
  );
};

export default PatientDashboard;
