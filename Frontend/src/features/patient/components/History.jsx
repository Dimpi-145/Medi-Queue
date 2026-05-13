import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getAppointmentHistory } from "../services/appointment.api";

import "./History.scss";

const History = ({ onChat }) => {
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);

  const [loading, setLoading] = useState(true);

  const handleOpenChat = (item) => {
    if (onChat) {
      onChat(item);
    } else {
      navigate(`/patient/chat/${item.id}`);
    }
  };

  const getDoctorName = (item) =>
    (item.doctor || item.doctorName || "Doctor")
      .replace(/^(Dr\.\s*)+/i, "")
      .trim() || "Doctor";

  /* ================= FETCH HISTORY ================= */
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);

        const res = await getAppointmentHistory();

        setHistory(res.data || []);
      } catch (err) {
        console.error("History Fetch Error:", err);

        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  /* ================= STATUS LABEL ================= */
  const getStatusLabel = (status) => {
    if (status === "completed") {
      return "Visit Completed";
    }

    if (status === "cancelled") {
      return "Appointment Cancelled";
    }

    return status;
  };

  return (
    <section className="card-panel history-panel">
      {/* ===== HEADER ===== */}
      <div className="panel-header">
        <div>
          <p className="eyebrow">Medical Timeline</p>

          <h2>Visit History</h2>
        </div>

        <div className="history-count">{history.length} Records</div>
      </div>

      {/* ===== LOADING ===== */}
      {loading ? (
        <div className="panel-empty">Loading history...</div>
      ) : history.length === 0 ? (
        /* ===== EMPTY ===== */
        <div className="panel-empty history-empty">
          <div className="empty-icon">🕘</div>

          <h3>No Visit History</h3>

          <p>Your completed visits and medical timeline will appear here.</p>
        </div>
      ) : (
        /* ===== TIMELINE ===== */
        <div className="timeline">
          {history.map((item, index) => (
            <div key={index} className="timeline-item">
              {/* ===== TIMELINE DOT ===== */}
              <div className="timeline-left">
                <div className={`timeline-dot ${item.status}`}></div>

                {index !== history.length - 1 && (
                  <div className="timeline-line"></div>
                )}
              </div>

              {/* ===== CARD ===== */}
              <div className="timeline-card">
                <div className="timeline-top">
                  <div>
                    <h3>Dr. {getDoctorName(item)}</h3>

                    <p className="timeline-date">
                      {new Date(item.date).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>

                  <span className={`status-badge ${item.status}`}>
                    {getStatusLabel(item.status)}
                  </span>
                </div>

                <div className="timeline-body">
                  <p>
                    {item.status === "completed"
                      ? "Consultation completed successfully with medical review and patient follow-up."
                      : "Appointment was cancelled before consultation."}
                  </p>

                  {item.status === "completed" && (
                    <div className="history-card-actions">
                      <button
                        className="history-chat-button"
                        onClick={() => handleOpenChat(item)}
                      >
                        Open Chat
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default History;
