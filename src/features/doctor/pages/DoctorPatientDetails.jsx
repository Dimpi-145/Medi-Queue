import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import { generatePrescriptionPDF } from "../../../utils/prescription";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import PatientDetails from "../components/PatientDetails";
import PrescriptionBox from "../components/PrescriptionBox";

import "../doctorDashboard.scss";

const DoctorPatientDetails = () => {
  const navigate = useNavigate();
  const { patientId } = useParams();

  const [patient, setPatient] = useState(null);
  const [prescriptionText, setPrescriptionText] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingPatient, setLoadingPatient] = useState(true);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [patientsAhead, setPatientsAhead] = useState(null);
  const [estimatedWait, setEstimatedWait] = useState(null);

  const doctorName = "Dr. Sharma";

  // ================= FETCH PATIENT =================
  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const res = await axios.get(
          `http://localhost:3000/api/auth/patients/${patientId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        setPatient(res.data);
      } catch (err) {
        console.error("Patient fetch error:", err.response?.data || err.message);
      } finally {
        setLoadingPatient(false);
      }
    };

    if (patientId) fetchPatient();
  }, [patientId]);

  // ================= FETCH QUEUE =================
  useEffect(() => {
    const fetchQueue = async () => {
      try {
        setLoadingQueue(true);

        const res = await axios.get("http://localhost:3000/api/queue/live", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const queueData = res.data?.patients || [];

        const index = queueData.findIndex((item) => {
          const id = item.patientId?._id || item.patientId;
          return id?.toString() === patientId;
        });

        if (index >= 0) {
          const wait = Math.max(0, index) * 10;
          setPatientsAhead(index);
          setEstimatedWait(wait);
        } else {
          setPatientsAhead(null);
          setEstimatedWait(null);
        }
      } catch (err) {
        console.error("Queue fetch error:", err.response?.data || err.message);
      } finally {
        setLoadingQueue(false);
      }
    };

    if (patientId) fetchQueue();
  }, [patientId]);

  // ================= PDF GENERATE =================
  const handleGeneratePdf = () => {
    if (!patient) return;

    generatePrescriptionPDF({
      patient,
      doctor: doctorName,
      prescriptionText,
    });
  };

  // ================= SUBMIT PRESCRIPTION =================
  const handleSubmitPrescription = async () => {
    try {
      setLoading(true);

      const payload = {
        patientId,
        notes: prescriptionText,
        medicines: [],
      };

      await axios.post(
        "http://localhost:3000/api/prescriptions/create",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      alert("Prescription submitted successfully");
      setPrescriptionText("");
    } catch (err) {
      console.error(
        "Prescription error:",
        err.response?.data || err.message
      );
    } finally {
      setLoading(false);
    }
  };

  // ================= NEXT PATIENT =================
  const handleNextPatient = async () => {
    try {
      setLoading(true);

      const res = await axios.put(
        "http://localhost:3000/api/queue/next",
        null,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const nextPatientId = res.data?.patientId;
      if (nextPatientId) {
        setPrescriptionText("");
        navigate(`/doctor-dashboard/patient/${nextPatientId}`);
      } else {
        alert("No more patients available in the queue.");
        navigate("/doctor-dashboard");
      }
    } catch (err) {
      console.error("Next patient error:", err.response?.data || err.message);
      alert("Unable to move to the next patient right now.");
    } finally {
      setLoading(false);
    }
  };

  // ================= LOADING UI =================
  if (loadingPatient) {
    return (
      <div className="doctor-dashboard">
        <Sidebar activeSection="Dashboard" setActiveSection={() => {}} />
        <div className="doctor-main">
          <Navbar doctorName={doctorName} onLogout={() => {}} />
          <div className="doctor-content">
            <div className="patient-detail-page">
              <p>Loading patient details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ================= NO PATIENT FOUND =================
  if (!patient) {
    return (
      <div className="doctor-dashboard">
        <Sidebar activeSection="Dashboard" setActiveSection={() => {}} />
        <div className="doctor-main">
          <Navbar doctorName={doctorName} onLogout={() => {}} />
          <div className="doctor-content">
            <div className="patient-detail-page">
              <p>Patient not found</p>
              <button className="back-button" onClick={() => navigate("/doctor-dashboard")}>
                Back to dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ================= MAIN UI =================
  return (
    <div className="doctor-dashboard">
      <Sidebar activeSection="Dashboard" setActiveSection={() => {}} />

      <div className="doctor-main">
        <Navbar doctorName={doctorName} onLogout={() => {}} />

        <div className="doctor-content">
          <div className="patient-detail-page">
            <div className="detail-actions" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
              <button className="back-button" onClick={() => navigate("/doctor-dashboard")}>Back to dashboard</button>
              <div className="queue-summary" style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
                <span>
                  Patients ahead: {loadingQueue ? "Loading..." : patientsAhead != null ? patientsAhead : "N/A"}
                </span>
                <span>
                  Estimated wait: {loadingQueue ? "Loading..." : estimatedWait != null ? `${estimatedWait} min` : "Calculating..."}
                </span>
              </div>
            </div>

            {/* PATIENT INFO */}
            <PatientDetails patient={patient} />

            {/* PRESCRIPTION BOX */}
            <PrescriptionBox
              prescriptionText={prescriptionText}
              onTextChange={setPrescriptionText}
              onGenerate={handleGeneratePdf}
              onSubmit={handleSubmitPrescription}
              onNext={handleNextPatient}
              disabled={loading || !prescriptionText.trim()}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorPatientDetails;