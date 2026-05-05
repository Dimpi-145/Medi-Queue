import React, { useEffect, useState } from "react";
import { getMyAppointments } from "../services/appointment.api";
import "./History.scss";

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // ================= FETCH HISTORY =================
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);

        const res = await getMyAppointments();
        
        // Filter for completed appointments
        const completedAppointments = (res.data || []).filter(
          (apt) => apt.status === "completed" || apt.status === "cancelled"
        );

        setHistory(completedAppointments || []);
      } catch (err) {
        console.error("History Fetch Error:", err);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <section className="card-panel history-panel">

      {/* HEADER */}
      <div className="panel-header">
        <div>
          <p className="eyebrow">Medical Timeline</p>
          <h2>Visit History</h2>
        </div>
      </div>

      {/* LOADING */}
      {loading ? (
        <div className="panel-empty">Loading history...</div>
      ) : history.length === 0 ? (
        <div className="panel-empty">No history available.</div>
      ) : (
        <div className="history-list">

          {history.map((item, index) => (
            <div key={index} className="history-row">

              <div>
                <h4>{item.doctorName}</h4>
                <p>{new Date(item.date).toLocaleDateString()}</p>
              </div>

              <span className={`status-badge ${item.status}`}>
                {item.status}
              </span>

            </div>
          ))}

        </div>
      )}

    </section>
  );
};

export default History;