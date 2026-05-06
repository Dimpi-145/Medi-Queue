import React, { useState, useEffect } from "react";
import { getPrescriptions } from "../services/api";
import "./Prescriptions.scss";

const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPrescriptions = async () => {
    try {
      const res = await getPrescriptions();
      setPrescriptions(res.data || []);
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  return (
    <div className="card-panel prescriptions-page">

      <div className="panel-header">
        <p className="eyebrow">Medical Records</p>
        <h2> NEW PRESCRIPTIONS PAGE</h2>
      </div>

      {loading && <div className="panel-empty">Loading prescriptions...</div>}

      {!loading && prescriptions.length === 0 && (
        <div className="panel-empty">No prescriptions available</div>
      )}

      <div className="prescription-list">
        {prescriptions.map((p) => (
          <div key={p.id} className="prescription-card">

            <div className="prescription-top">
              <div>
                <h3>Dr. {p.doctorName}</h3>
                <p className="meds">{p.medicines || "No details"}</p>
              </div>

              <span className="date">
                {new Date(p.date).toLocaleDateString()}
              </span>
            </div>

            <div className="prescription-bottom">
              <button className="btn view">View</button>
              <button className="btn download">Download</button>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
};

export default Prescriptions;