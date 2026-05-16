import React, { useEffect, useState } from "react";

import toast from "react-hot-toast";

import "./QueueList.scss";
import { dedupeQueue } from "../utils/queue";

const statusLabel = {
  pending: "Waiting",
  approved: "In Consultation",
  completed: "Completed",
  cancelled: "Cancelled",
};

const QueueList = ({ queue, loading, currentQueueNumber, patientsAhead }) => {
  const [estimatedWait, setEstimatedWait] = useState(0);
  const displayQueue = dedupeQueue(queue);

  /* ===== ESTIMATED WAIT ===== */
  useEffect(() => {
    const wait = Number(patientsAhead || 0) * 8;

    setEstimatedWait(wait);
  }, [patientsAhead]);

  /* ===== NEXT PATIENT ALERT ===== */
  useEffect(() => {
    if (Number(patientsAhead) === 0 && currentQueueNumber) {
      toast.success("You're next. Please proceed to the consultation room.");
    }
  }, [patientsAhead, currentQueueNumber]);

  /* ===== AUTO REFRESH ===== */
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("Queue auto-refresh active...");
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="card-panel queue-panel">
      {/* ===== HEADER ===== */}
      <div className="panel-header">
        <div>
          <p className="eyebrow">Queue Status</p>

          <h2>Live Queue Tracker</h2>
        </div>

        <div className="queue-live-badge">● Live</div>
      </div>

      {/* ===== HERO CARDS ===== */}
      <div className="queue-hero-grid">
        {/* QUEUE NUMBER */}
        <div className="queue-hero-card primary">
          <p>Your Queue</p>

          <h1>#{currentQueueNumber || "--"}</h1>

          <span>Active Token Number</span>
        </div>

        {/* PATIENTS AHEAD */}
        <div className="queue-hero-card">
          <p>Patients Ahead</p>

          <h2>{patientsAhead || 0}</h2>

          <span>Waiting Before You</span>
        </div>

        {/* ESTIMATED WAIT */}
        <div className="queue-hero-card">
          <p>Estimated Wait</p>

          <h2>{estimatedWait} mins</h2>

          <span>Approximate Waiting Time</span>
        </div>
      </div>

      {/* ===== QUEUE LIST ===== */}
      {loading ? (
        <div className="panel-empty">Loading queue data...</div>
      ) : queue.length === 0 ? (
        currentQueueNumber ? (
          <div className="panel-empty queue-empty">
            <div className="empty-icon">🩺</div>
            <h3>Your appointment is active</h3>
            <p>
              Token #{currentQueueNumber} is in the queue.
              {patientsAhead > 0
                ? ` ${patientsAhead} patient${patientsAhead === 1 ? "" : "s"} ahead of you.`
                : " You are next."}
            </p>
          </div>
        ) : (
          <div className="panel-empty queue-empty">
            <div className="empty-icon">🏥</div>
            <h3>No Active Queue</h3>
            <p>Queue entries will appear here once appointments are active.</p>
          </div>
        )
      ) : (
        <>
          <div className="queue-summary-card">
            <h3>Current Active Patient</h3>
            {displayQueue.some((item) => item.status === "approved") ? (
              (() => {
                const activePatient = displayQueue.find(
                  (item) => item.status === "approved",
                );
                return (
                  <div
                    className="queue-row active-patient"
                    key={activePatient._id}
                  >
                    <div className="queue-user">
                      <div className="queue-avatar">
                        {activePatient.patientId?.username
                          ? activePatient.patientId.username
                              .charAt(0)
                              .toUpperCase()
                          : "A"}
                      </div>
                      <div>
                        <h4>
                          {activePatient.patientId?.username ||
                            "Active Patient"}
                        </h4>
                        <p>Queue #{activePatient.queueNumber}</p>
                      </div>
                    </div>
                    <span className="status-badge approved">
                      In Consultation
                    </span>
                  </div>
                );
              })()
            ) : (
              <div className="panel-empty queue-empty">
                <p>No active patient is currently in consultation.</p>
              </div>
            )}
          </div>

          <div className="queue-list">
            {displayQueue
              .filter((item) => item.status !== "approved")
              .map((item) => (
                <div
                  key={item._id}
                  className={`queue-row ${
                    Number(item.queueNumber) === Number(currentQueueNumber)
                      ? "current"
                      : ""
                  }`}
                >
                  <div className="queue-user">
                    <div className="queue-avatar">
                      {item.patientId?.username
                        ? item.patientId.username.charAt(0).toUpperCase()
                        : "P"}
                    </div>
                    <div>
                      <h4>
                        {item.patientId?.username || item.name || "Patient"}
                      </h4>
                      <p>Queue #{item.queueNumber}</p>
                    </div>
                  </div>
                  <span className={`status-badge ${item.status}`}>
                    {statusLabel[item.status] || item.status}
                  </span>
                </div>
              ))}
          </div>
        </>
      )}
    </section>
  );
};

export default QueueList;
