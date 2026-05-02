import React, { useEffect, useState } from "react";
import axios from "axios";
import "./PrescriptionList.scss";

const Prescription = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // ================= FETCH PRESCRIPTIONS =================
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const res = await axios.get(
          "http://localhost:3000/api/prescriptions/my",
          { withCredentials: true }
        );

        setPrescriptions(res.data || []);
      } catch (err) {
        console.error("Prescription Fetch Error:", err);
        setPrescriptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <section className="card-panel prescription-panel">

      {/* HEADER */}
      <div className="panel-header">
        <div>
          <p className="eyebrow">Medical Records</p>
          <h2>Prescriptions</h2>
        </div>
      </div>

      {/* LOADING */}
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

                <button className="secondary-button">
                  View
                </button>
              </div>

            </div>
          ))}

        </div>
      )}

    </section>
  );
};

export default Prescription;