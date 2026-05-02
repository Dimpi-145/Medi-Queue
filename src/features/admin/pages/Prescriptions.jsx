import React, { useState, useEffect } from "react";
import { getPrescriptions } from "../services/api";
import "./Prescriptions.scss";

const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);

  const fetchPrescriptions = async () => {
    try {
      const res = await getPrescriptions();
      setPrescriptions(res.data || []);
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
      setPrescriptions([]);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const downloadPrescription = (fileUrl) => {
    if (!fileUrl) return;
    window.open(fileUrl, "_blank");
  };

  return (
    <div className="prescriptions">
      <h2>Prescription Management</h2>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {prescriptions.map((p) => (
              <tr key={p.id}>
                <td>{p.patientName}</td>
                <td>{p.doctorName}</td>
                <td>{new Date(p.date).toLocaleDateString()}</td>
                <td>
                  <button
                    className="btn-primary"
                    onClick={() => downloadPrescription(p.fileUrl)}
                  >
                    Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  );
};

export default Prescriptions;