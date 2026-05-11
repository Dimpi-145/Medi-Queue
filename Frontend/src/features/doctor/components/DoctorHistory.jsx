import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDoctorHistory } from "../services/doctor.api";
import {
  getDoctorVideoRequests,
  respondToVideoRequest,
} from "../services/video.api";
import "./DoctorHistory.scss";

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const DoctorHistory = ({ onChat, socket }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [videoRequests, setVideoRequests] = useState([]);
  const [actionLoading, setActionLoading] = useState({});
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const [historyRes, videoRes] = await Promise.all([
          getDoctorHistory(),
          getDoctorVideoRequests("pending"),
        ]);

        const requests = videoRes.data.videoRequests || [];
        setVideoRequests(requests);

        const consultations = (historyRes.data.consultations || []).map(
          (item) => ({
            ...item,
            videoRequest: requests.find(
              (req) =>
                req.appointmentId?._id?.toString() === item.id?.toString() ||
                req.appointmentId?.toString() === item.id?.toString()
            ),
          })
        );

        setHistory(consultations);
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Failed to load history");
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleVideoRequest = (payload) => {
      const request = {
        _id: payload.videoRequestId,
        appointmentId: payload.appointmentId,
        status: "pending",
        patientName: payload.patientName,
      };

      setVideoRequests((prev) => [request, ...prev]);
      setHistory((prev) =>
        prev.map((item) =>
          item.id?.toString() === payload.appointmentId?.toString()
            ? { ...item, videoRequest: request }
            : item
        )
      );
    };

    socket.on("videoRequestReceived", handleVideoRequest);

    return () => {
      socket.off("videoRequestReceived", handleVideoRequest);
    };
  }, [socket]);

  const groupedHistory = useMemo(() => {
    return history.reduce((groups, item) => {
      const dateKey = formatDate(item.date);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(item);
      return groups;
    }, {});
  }, [history]);

  const handleOpenChat = (item) => {
    onChat({
      appointmentId: item.id,
      contactName: item.patient?.username || "Patient",
      patientName: item.patient?.username,
      currentUserRole: "doctor",
      isDoctor: true,
    });
  };

  const handleVideoResponse = async (requestId, action) => {
    try {
      setActionLoading((prev) => ({ ...prev, [requestId]: true }));
      const res = await respondToVideoRequest(requestId, action);
      setVideoRequests((prev) =>
        prev.map((item) =>
          item._id === requestId
            ? { ...item, status: action === "accept" ? "accepted" : "rejected" }
            : item
        )
      );
      setHistory((prev) =>
        prev.map((item) =>
          item.videoRequest?._id === requestId
            ? {
                ...item,
                videoRequest: {
                  ...item.videoRequest,
                  status: action === "accept" ? "accepted" : "rejected",
                },
              }
            : item
        )
      );
      if (action === "accept") {
        const roomId = res.data.videoRequest?.roomId;
        if (roomId) {
          navigate(`/video-room/${roomId}`);
        }
      }
    } catch (err) {
      console.error("Video response failed", err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  return (
    <section className="doctor-history-panel">
      <div className="history-header">
        <div>
          <p className="eyebrow">Consultation Timeline</p>
          <h2>Doctor History</h2>
          <p className="subtext">
            Completed consultations only. Use Open Chat for follow-up medical communication.
          </p>
        </div>
        <div className="record-count">{history.length} completed</div>
      </div>

      {loading ? (
        <div className="history-empty">Loading completed consultations...</div>
      ) : error ? (
        <div className="history-empty error">{error}</div>
      ) : history.length === 0 ? (
        <div className="history-empty">
          <div className="empty-icon">🩺</div>
          <h3>No completed consultations yet</h3>
          <p>
            Completed consultation history will appear here once appointments are closed.
          </p>
        </div>
      ) : (
        <div className="history-groups">
          {Object.entries(groupedHistory).map(([date, items]) => (
            <div key={date} className="history-group">
              <div className="history-group-date">{date}</div>
              <div className="history-group-cards">
                {items.map((item) => (
                  <article key={item.id} className="history-card">
                    <div className="card-top">
                      <div className="patient-avatar">
                        {item.patient?.username?.[0] || "P"}
                      </div>
                      <div>
                        <h3>{item.patient?.username || "Unknown Patient"}</h3>
                        <p>
                          {item.patient?.gender || "Unknown gender"} ・ {item.patient?.age || "—"} years
                        </p>
                      </div>
                      <span className="status-badge completed">Consultation Completed</span>
                    </div>

                    <div className="card-body">
                      <div className="row">
                        <span>Date</span>
                        <strong>{formatDate(item.date)}</strong>
                      </div>
                      <div className="row">
                        <span>Queue No</span>
                        <strong>{item.queueNumber ?? "—"}</strong>
                      </div>
                      <div className="row">
                        <span>Prescription</span>
                        <strong>{item.status === "completed" ? "Ready" : "N/A"}</strong>
                      </div>
                    </div>

                    <div className="card-actions">
                      <button className="open-chat-btn" onClick={() => handleOpenChat(item)}>
                        Open Chat
                      </button>
                      {item.videoRequest && item.videoRequest.status === "pending" && (
                        <div className="video-request-row">
                          <span className="video-request-label">Video request pending</span>
                          <button
                            className="accept-btn"
                            onClick={() => handleVideoResponse(item.videoRequest._id, "accept")}
                            disabled={actionLoading[item.videoRequest._id]}
                          >
                            Accept
                          </button>
                          <button
                            className="reject-btn"
                            onClick={() => handleVideoResponse(item.videoRequest._id, "reject")}
                            disabled={actionLoading[item.videoRequest._id]}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default DoctorHistory;
