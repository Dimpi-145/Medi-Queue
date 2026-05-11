import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import toast from "react-hot-toast";
import {generatePrescriptionPDF} from "../../../utils/prescription";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import PatientDetails from "../components/PatientDetails";
import PrescriptionBox from "../components/PrescriptionBox";
import {completeCurrent, callNextPatient} from "../services/doctor.api";

import "../doctorDashboard.scss";

const DoctorPatientDetails = () => {
  const navigate = useNavigate();
  const { patientId } = useParams();

  const [patient, setPatient] = useState(null);
  const [prescriptionText, setPrescriptionText] = useState("");
  const [loading, setLoading] = useState(false);
  const [queue, setQueue] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    localStorage.getItem("doctorQueueDate") ||
      new Date().toISOString().split("T")[0]
  );

  const socketRef = React.useRef(null);

  // ================= FETCH PATIENT =================
  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const res = await axios.get(
          `http://localhost:3000/api/queue/patient/${patientId}`,
          { withCredentials: true }
        );

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
          appointmentId: appointmentData.id
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
      const res = await axios.get(
        "http://localhost:3000/api/queue/live",
        { withCredentials: true }
      );
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
    const socket = io("http://localhost:3000");
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
      console.log("Queue updated:", data);
      // Refresh queue when updates happen
      fetchQueue();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // ================= PDF GENERATE =================
  const handleGeneratePdf = () => {
  if (!patient) return;

  generatePrescriptionPDF({
    patient,
    doctor: "Dr. Sharma",
    prescriptionText,
  });
};
  // ================= SUBMIT PRESCRIPTION =================
  const handleSubmitPrescription = async () => {
  try {
    setLoading(true);

    const payload = {
      patientId: patientId,   // from URL
      notes: prescriptionText,
      medicines: []
    };

    console.log("SENDING:", payload);

    await axios.post(
      "http://localhost:3000/api/prescriptions/create",
      payload,
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

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
        err.response?.data?.message ||
        "No patients left in queue";
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

            {/* PRESCRIPTION BOX */}
            <PrescriptionBox
              prescriptionText={prescriptionText}
              onTextChange={setPrescriptionText}
              onGenerate={handleGeneratePdf}
              onSubmit={handleSubmitPrescription}
              onNext={handleNextPatient}
              loading={loading}
            />

          </div>

        </div>
      </div>
    </div>
  );
};

export default DoctorPatientDetails;