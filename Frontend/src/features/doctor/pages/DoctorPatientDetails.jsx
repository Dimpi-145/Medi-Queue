import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../../../utils/axios";
import io from "socket.io-client";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import PatientDetails from "../components/PatientDetails";
import PrescriptionBox from "../components/PrescriptionBox";
import { callNextPatient } from "../services/doctor.api";

import "../doctorDashboard.scss";

const BACKEND_URL =
  import.meta.env.DEV
    ? ""
    : import.meta.env.VITE_BACKEND_URL || "https://medi-queue-1.onrender.com";

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const DoctorPatientDetails = () => {
  const navigate = useNavigate();
  const { patientId } = useParams();
  const today = getLocalDateString();

  const [patient, setPatient] = useState(null);
  const [prescriptionText, setPrescriptionText] = useState("");
  const [loading, setLoading] = useState(false);
  const [queue, setQueue] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    localStorage.getItem("doctorQueueDate") || getLocalDateString(),
  );
  const isQueueActive = selectedDate === today;

  const socketRef = React.useRef(null);

  // ================= FETCH PATIENT =================
  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const res = await API.get(`/queue/patient/${patientId}`);

        // Transform the data to match component expectations
        const patientData = res.data.patient;
        const appointmentData = res.data.appointment;

        const transformedPatient = {
          name: patientData.username,
          age: patientData.age,
          gender: patientData.gender,
          queueNumber: appointmentData.queueNumber,
          status: appointmentData.status,
          email: patientData.email,
          phone: patientData.phone,
          appointmentId: appointmentData.id,
        };

        setPatient(transformedPatient);
      } catch (err) {
        console.error("Patient fetch error:", err);
      }
    };

    if (patientId) {
      fetchPatient();
    }
  }, [patientId]);

  // ================= FETCH QUEUE =================
  const fetchQueue = async () => {
    try {
      const res = await API.get("/queue/live", {
        params: { date: selectedDate },
      });
      const queueData = res.data?.patients || res.data || [];
      setQueue(Array.isArray(queueData) ? queueData : []);
    } catch (err) {
      console.error("Queue fetch error:", err);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  // ================= SOCKET SETUP =================
  useEffect(() => {
    const socket = io(BACKEND_URL);
    socketRef.current = socket;

    // Join doctor room
    socket.on("connect", () => {
      const doctorId = localStorage.getItem("doctorId");
      if (doctorId) {
        socket.emit("joinDoctorRoom", doctorId);
      }
    });

    // Listen for queue updates
    socket.on("queueUpdated", (data) => {
      const doctorId = localStorage.getItem("doctorId");
      if (
        doctorId &&
        data.doctorId &&
        String(data.doctorId) !== String(doctorId)
      ) {
        return;
      }
      fetchQueue();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // ================= SUBMIT PRESCRIPTION =================
  const handleSubmitPrescription = async () => {
    try {
      setLoading(true);

      const payload = {
        patientId: patientId, // from URL
        notes: prescriptionText,
        medicines: [],
      };

      console.log("SENDING:", payload);

      await API.post("/prescriptions/create", payload);

      alert("Prescription submitted successfully");
      setPrescriptionText("");
    } catch (err) {
      console.error("Prescription error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  // ================= NEXT PATIENT =================
  const handleNextPatient = async () => {
    if (!isQueueActive) {
      toast.error("Queue is inactive for this date");
      return;
    }

    try {
      const response = await callNextPatient(selectedDate);

      if (response.data && response.data.patientId) {
        toast.success("Opened next patient profile.");
        setPrescriptionText("");
        navigate(`/doctor-dashboard/patient/${response.data.patientId}`);
      } else {
        toast.error("No patients left in queue");
        setPrescriptionText("");
        navigate("/doctor-dashboard");
      }
    } catch (err) {
      const message =
        err.response?.data?.message || "No patients left in queue";
      toast.error(message);
      console.error("Error calling next patient:", err);

      const approvedPatient = queue.find((q) => q.status === "approved");
      if (approvedPatient) {
        setPrescriptionText("");
        navigate(`/doctor-dashboard/patient/${approvedPatient.patientId?._id}`);
      } else {
        setPrescriptionText("");
        navigate("/doctor-dashboard");
      }
    }
  };

  return (
    <div className="doctor-dashboard">
      <Sidebar activeSection="Dashboard" setActiveSection={() => {}} />

      <div className="doctor-main">
        <Navbar doctorName="Dr. Sharma" onLogout={() => {}} />

        <div className="doctor-content">
          <div className="patient-detail-page">
            <button
              className="back-button"
              onClick={() => navigate("/doctor-dashboard")}
            >
              Back to dashboard
            </button>

            {/* PATIENT INFO */}
            <PatientDetails patient={patient} />

            <div
              className={`queue-state-banner ${isQueueActive ? "active" : "inactive"}`}
            >
              Queue status: {isQueueActive ? "Active" : "Inactive"}
            </div>

            {/* PRESCRIPTION BOX */}
            <PrescriptionBox
              prescriptionText={prescriptionText}
              onTextChange={setPrescriptionText}
              onSubmit={handleSubmitPrescription}
              onNext={handleNextPatient}
              loading={loading}
              disabled={!isQueueActive}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorPatientDetails;
