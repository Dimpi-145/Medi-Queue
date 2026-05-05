import React from "react";
import { createPrescriptionPdfBlob } from "../../../utils/prescription";
import "./PrescriptionList.scss";

const PrescriptionList = ({ prescriptions = [], loading = false, patient }) => {
  const downloadPrescription = (item) => {
    const blob = createPrescriptionPdfBlob({
      patient,
      doctor: item.doctorId?.username || "Doctor",
      prescriptionText: item.notes || "No notes provided.",
    });

    const fileName = `prescription_${(patient?.username || "patient")
      .replace(/\s+/g, "_")
      .toLowerCase()}_${new Date(item.createdAt).toISOString().slice(0, 10)}.pdf`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const viewPrescription = (item) => {
    const blob = createPrescriptionPdfBlob({
      patient,
      doctor: item.doctorId?.username || "Doctor",
      prescriptionText: item.notes || "No notes provided.",
    });

    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  return (
    <section className="card-panel prescription-panel">

      {/* HEADER */}
      <div className="panel-header">
        <div>
          <p className="eyebrow">Medical Records</p>
          <h2>Prescriptions</h2>
        </div>
      </div>

      {loading ? (
        <div className="panel-empty">Loading prescriptions...</div>
      ) : prescriptions.length === 0 ? (
        <div className="panel-empty">No prescriptions available.</div>
      ) : (
        <div className="prescription-list">
          {prescriptions.map((item, index) => (
            <div key={index} className="prescription-row">
              <div>
                <h4>Dr. {item.doctorId?.username || "Doctor"}</h4>
                <p>{item.notes}</p>
              </div>

              <div className="prescription-meta">
                <span className="date">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
                <button className="secondary-button" onClick={() => viewPrescription(item)}>
                  View
                </button>
                <button className="secondary-button" onClick={() => downloadPrescription(item)}>
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default PrescriptionList;