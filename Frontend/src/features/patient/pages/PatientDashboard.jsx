import React, { useCallback, useEffect, useRef, useState } from "react";
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
import {
  getMyAppointments,
  bookAppointment,
  cancelAppointment,
} from "../services/appointment.api";
import { getPatientDashboard } from "../services/dashboard.api";
import { getMyPrescriptions } from "../services/prescription.api";
import { getMyReports } from "../services/report.api";
import { updateProfile } from "../../auth/services/auth.api";
import { getQueuePosition } from "../services/queue.api";

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
  const [queuePosition, setQueuePosition] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const [showModal, setShowModal] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  const dashboardCtxRef = useRef({
    date: selectedDate,
    doctorId: null,
  });

  useEffect(() => {
    dashboardCtxRef.current = {
      date: activeAppointment?.date || selectedDate,
      doctorId:
        activeAppointment?.doctorId?._id || activeAppointment?.doctorId || null,
    };
  }, [activeAppointment, selectedDate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const openChat = (appointment) => {
    navigate(`/patient/chat/${appointment.id}`);
  };

  const fetchLiveQueue = useCallback(async (date, doctorId) => {
    try {
      setLoadingQueue(true);
      const res = await API.get(
        `/queue/live?date=${date}${doctorId ? `&doctorId=${doctorId}` : ""}`,
      );
      const queueData = res.data?.patients || [];
      setQueue(Array.isArray(queueData) ? queueData : []);
    } catch (err) {
      console.error("Queue fetch error:", err);
      setQueue([]);
    } finally {
      setLoadingQueue(false);
    }
  }, []);

  const fetchQueueStatus = useCallback(async () => {
    if (!activeAppointment?._id) return;
    try {
      const res = await getQueuePosition(activeAppointment._id);
      setQueuePosition(res.data);
    } catch (err) {
      console.error("Queue position fetch error:", err);
      setQueuePosition(null);
    }
  }, [activeAppointment?._id]);

  const fetchDashboard = useCallback(
    async (dateOverride) => {
      try {
        setLoading(true);
        const dateToQuery =
          dateOverride !== undefined && dateOverride !== null
            ? dateOverride
            : selectedDate;
        const res = await getPatientDashboard(dateToQuery);
        setPatient(res.data?.patient || null);
        setQueueInfo(res.data?.queueInfo || null);
        const aa = res.data?.activeAppointment || null;
        setActiveAppointment(aa);
        const effectiveDate = aa?.date || dateToQuery;
        if (aa?.date) {
          setSelectedDate(aa.date);
        }
        const docId = aa?.doctorId?._id || aa?.doctorId || null;
        await fetchLiveQueue(effectiveDate, docId);
        await fetchQueueStatus();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [selectedDate, fetchLiveQueue],
  );

  useEffect(() => {
    if (activeTab !== "Queue Status") return;
    fetchDashboard(selectedDate);
  }, [activeTab]); // refresh live queue + dashboard when opening this tab

  useEffect(() => {
    if (!activeAppointment) {
      return;
    }

    const socket = io("http://localhost:3000");
    const doctorDocId =
      activeAppointment.doctorId?._id || activeAppointment.doctorId;
    const patientId = localStorage.getItem("userId");

    const onConnect = () => {
      if (patientId) {
        socket.emit("joinUserRoom", patientId);
      }
      if (doctorDocId) {
        socket.emit("joinDoctorRoom", doctorDocId);
      }
    };

    socket.on("connect", onConnect);
    if (socket.connected) {
      onConnect();
    }

    socket.on("queueUpdated", (data) => {
      const matchesDoctor =
        doctorDocId != null && String(data.doctorId) === String(doctorDocId);
      const matchesPatient =
        data.patientId &&
        patientId &&
        String(data.patientId) === String(patientId);
      if (matchesDoctor || matchesPatient) {
        const { date } = dashboardCtxRef.current;
        fetchDashboard(date);
        fetchQueueStatus();
      }
    });

    return () => {
      socket.off("connect", onConnect);
      socket.off("queueUpdated");
      socket.disconnect();
    };
  }, [activeAppointment, fetchDashboard, fetchQueueStatus]);

  const fetchAppointments = async () => {
    try {
      const res = await getMyAppointments();
      const formatted = (res.data || []).map((item) => ({
        id: item.id || item._id,
        doctor: item.doctor || item.doctorId?.username || "Doctor",
        date: item.date ? new Date(item.date).toLocaleDateString() : "N/A",
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

  const fetchAllData = async () => {
    await Promise.all([
      fetchDashboard(),
      fetchAppointments(),
      fetchPrescriptions(),
      fetchReportsCount(),
    ]);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (activeAppointment) {
      fetchQueueStatus();
    }
  }, [activeAppointment, fetchQueueStatus]);

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
      fetchDashboard(dashboardCtxRef.current.date);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    try {
      console.log("🗑️ Cancelling appointment:", appointmentId);
      const activeAppointmentId = activeAppointment?._id?.toString();

      await cancelAppointment(appointmentId);
      await fetchAppointments();
      await fetchDashboard(dashboardCtxRef.current.date);
      await fetchQueueStatus();

      if (appointmentId === activeAppointmentId) {
        setQueuePosition(null);
      }
    } catch (err) {
      console.error("❌ Failed to cancel appointment:", err);
      await fetchAppointments();
    }
  };

  const patientKey = String(
    patient?._id || localStorage.getItem("userId") || "",
  );
  const myQueueRow = queue.find(
    (q) => String(q.patientId?._id || q.patientId) === patientKey,
  );
  const currentQueueNumber =
    queuePosition?.yourQueueNumber ??
    queueInfo?.liveQueueNumber ??
    queueInfo?.queueNumber ??
    myQueueRow?.queueNumber ??
    "-";
  const patientsAhead =
    queuePosition?.patientsAhead ?? queueInfo?.patientsAhead ?? 0;

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
              onCancel={handleCancelAppointment}
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
                      const v = e.target.value;
                      setSelectedDate(v);
                      fetchDashboard(v);
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

            <AppointmentForm
              onBook={handleBook}
              loading={loading}
              onClose={() => setShowModal(false)}
            />
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
