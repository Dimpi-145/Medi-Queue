import React, {
  useEffect,
  useState,
} from "react";

import toast from "react-hot-toast";

import "./QueueList.scss";

const statusLabel = {
  waiting: "Waiting",
  called: "Called",
  completed: "Completed",
};

const QueueList = ({
  queue,
  loading,
  currentQueueNumber,
  patientsAhead,
}) => {

  const [estimatedWait, setEstimatedWait] =
    useState(0);

  /* ===== ESTIMATED WAIT ===== */
  useEffect(() => {

    const wait =
      Number(patientsAhead || 0) * 8;

    setEstimatedWait(wait);

  }, [patientsAhead]);

  /* ===== NEXT PATIENT ALERT ===== */
  useEffect(() => {

    if (
      Number(patientsAhead) === 0 &&
      currentQueueNumber
    ) {

      toast.success(
        "You're next. Please proceed to the consultation room."
      );
    }

  }, [patientsAhead, currentQueueNumber]);

  /* ===== AUTO REFRESH ===== */
  useEffect(() => {

    const interval = setInterval(() => {

      console.log(
        "Queue auto-refresh active..."
      );

    }, 30000);

    return () =>
      clearInterval(interval);

  }, []);

  return (
    <section className="card-panel queue-panel">

      {/* ===== HEADER ===== */}
      <div className="panel-header">

        <div>

          <p className="eyebrow">
            Queue Status
          </p>

          <h2>
            Live Queue Tracker
          </h2>

        </div>

        <div className="queue-live-badge">

          ● Live

        </div>

      </div>

      {/* ===== HERO CARDS ===== */}
      <div className="queue-hero-grid">

        {/* QUEUE NUMBER */}
        <div className="queue-hero-card primary">

          <p>Your Queue</p>

          <h1>
            #{currentQueueNumber || "--"}
          </h1>

          <span>
            Active Token Number
          </span>

        </div>

        {/* PATIENTS AHEAD */}
        <div className="queue-hero-card">

          <p>Patients Ahead</p>

          <h2>
            {patientsAhead || 0}
          </h2>

          <span>
            Waiting Before You
          </span>

        </div>

        {/* ESTIMATED WAIT */}
        <div className="queue-hero-card">

          <p>Estimated Wait</p>

          <h2>
            {estimatedWait} mins
          </h2>

          <span>
            Approximate Waiting Time
          </span>

        </div>

      </div>

      {/* ===== STATUS TRACKER ===== */}
      <div className="queue-progress-card">

        <div className="progress-header">

          <h3>
            Queue Progress
          </h3>

          <span>
            Real-time consultation status
          </span>

        </div>

        <div className="progress-steps">

          <div className="progress-step completed">

            <div className="step-dot"></div>

            <p>
              Appointment Confirmed
            </p>

          </div>

          <div className="progress-line active"></div>

          <div
            className={`progress-step ${
              patientsAhead === 0
                ? "active"
                : "completed"
            }`}
          >

            <div className="step-dot"></div>

            <p>
              Waiting Queue
            </p>

          </div>

          <div
            className={`progress-line ${
              patientsAhead === 0
                ? "active"
                : ""
            }`}
          ></div>

          <div
            className={`progress-step ${
              patientsAhead === 0
                ? "active"
                : ""
            }`}
          >

            <div className="step-dot"></div>

            <p>
              Consultation
            </p>

          </div>

          <div className="progress-line"></div>

          <div className="progress-step">

            <div className="step-dot"></div>

            <p>
              Completed
            </p>

          </div>

        </div>

      </div>

      {/* ===== DOCTOR CARD ===== */}
      <div className="doctor-card">

        <div className="doctor-avatar">
          D
        </div>

        <div className="doctor-details">

          <h3>
            Dr. Smith
          </h3>

          <p>
            General Physician
          </p>

          <span>
            Consultation Room 204
          </span>

        </div>

        <div className="doctor-status">

          Available

        </div>

      </div>

      {/* ===== QUEUE LIST ===== */}
      {loading ? (

        <div className="panel-empty">
          Loading queue data...
        </div>

      ) : queue.length === 0 ? (

        <div className="panel-empty queue-empty">

          <div className="empty-icon">
            🏥
          </div>

          <h3>
            No Active Queue
          </h3>

          <p>
            Queue entries will appear
            here once appointments
            are active.
          </p>

        </div>

      ) : (

        <div className="queue-list">

          {queue.map((item, index) => (

            <div
              key={index}
              className={`queue-row ${
                item.number ===
                currentQueueNumber
                  ? "current"
                  : ""
              }`}
            >

              <div className="queue-user">

                <div className="queue-avatar">

                  {item.name
                    ?.charAt(0)
                    ?.toUpperCase()}

                </div>

                <div>

                  <h4>
                    {item.name}
                  </h4>

                  <p>
                    Queue #
                    {item.number}
                  </p>

                </div>

              </div>

              <span
                className={`status-badge ${item.status}`}
              >

                {
                  statusLabel[
                    item.status
                  ]
                }

              </span>

            </div>
          ))}

        </div>
      )}

    </section>
  );
};

export default QueueList;