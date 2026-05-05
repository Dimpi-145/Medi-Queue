import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {generatePrescriptionPDF} from "../../../utils/prescription";
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
  const handleNextPatient = () => {
    setPrescriptionText("");
    navigate("/doctor-dashboard");
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