import React, { useState } from "react";
import { createPrescriptionPdfBlob } from "../../../utils/prescription";
import "./PrescriptionList.scss";

const PrescriptionList = ({ prescriptions = [], loading = false, patient }) => {
  /* ===== SEARCH ===== */
  const [searchTerm, setSearchTerm] = useState("");

  const buildFallbackFileName = (item) =>
    `prescription_${(patient?.username || "patient")
      .replace(/\s+/g, "_")
      .toLowerCase()}_${new Date(item.createdAt).toISOString().slice(0, 10)}.pdf`;

  const fetchPrescriptionBlob = async (item) => {
    return createPrescriptionPdfBlob({
      patient,
      doctor: item.doctorId?.username || "Doctor",
      prescriptionText: item.notes || "No notes provided.",
    });
  };

  /* ===== FILTERED PRESCRIPTIONS ===== */
  const filteredPrescriptions = prescriptions.filter((item) => {
    const doctorName = item.doctorId?.username?.toLowerCase() || "";

    return doctorName.includes(searchTerm.toLowerCase());
  });

  /* ===== DOWNLOAD ===== */
  const downloadPrescription = async (item) => {
    const blob = await fetchPrescriptionBlob(item);
    const fileName = item.fileName || buildFallbackFileName(item);
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;

    link.click();

    URL.revokeObjectURL(url);
  };

  /* ===== VIEW ===== */
  const viewPrescription = async (item) => {
    const blob = await fetchPrescriptionBlob(item);

    const url = URL.createObjectURL(blob);

    window.open(url, "_blank");

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 10000);
  };

  return (
    <section className="card-panel prescription-panel">
      {/* ===== HEADER ===== */}
      <div className="panel-header">
        <div>
          <p className="eyebrow">Medical Records</p>

          <h2>Prescriptions</h2>
        </div>

        <div className="prescription-count">
          {filteredPrescriptions.length} Records
        </div>
      </div>

      {/* ===== SEARCH BAR ===== */}
      <div className="prescription-search">
        <input
          type="text"
          placeholder="Search by doctor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* ===== LOADING ===== */}
      {loading ? (
        <div className="panel-empty">Loading prescriptions...</div>
      ) : filteredPrescriptions.length === 0 ? (
        /* ===== EMPTY ===== */
        <div className="panel-empty">
          {searchTerm
            ? "No matching prescriptions found."
            : "No prescriptions available."}
        </div>
      ) : (
        /* ===== LIST ===== */
        <div className="prescription-list">
          {filteredPrescriptions.map((item, index) => (
            <div key={index} className="prescription-card">
              {/* LEFT STRIP */}
              <div className="prescription-accent"></div>

              {/* MAIN CONTENT */}
              <div className="prescription-content">
                {/* TOP */}
                <div className="prescription-top">
                  <div className="doctor-info">
                    <div className="doctor-avatar">
                      {(item.doctorId?.username || "D").charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <h4>Dr. {item.doctorId?.username || "Doctor"}</h4>

                      <p className="speciality">Medical Specialist</p>
                    </div>
                  </div>

                  <div className="prescription-status">Completed</div>
                </div>

                {/* BODY */}
                <div className="prescription-body">
                  <p className="prescription-label">Prescription Notes</p>

                  <p className="prescription-text">
                    {item.notes || "No prescription notes provided."}
                  </p>
                </div>

                {/* FOOTER */}
                <div className="prescription-footer">
                  <div className="prescription-date">
                    <span>Issued:</span>

                    {new Date(item.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>

                  <div className="prescription-actions">
                    <button
                      className="secondary-button"
                      onClick={() => viewPrescription(item)}
                    >
                      View
                    </button>

                    <button
                      className="primary-button"
                      onClick={() => downloadPrescription(item)}
                    >
                      Download PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default PrescriptionList;
