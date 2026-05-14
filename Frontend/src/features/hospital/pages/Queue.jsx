import React, { useState, useEffect } from "react";
import {
  Activity,
  ClipboardList,
  Clock3,
  PlusCircle,
  UserRound,
  Stethoscope,
  CheckCircle2,
} from "lucide-react";

import api, {
  getLiveQueue,
  addToQueue,
  getPatients,
  getDoctors,
} from "../services/api";

import "./Queue.scss";

const Queue = () => {
  const [queue, setQueue] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    patientId: "",
    doctorId: "",
  });

  // ================= FETCH QUEUE =================
  const fetchQueue = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getLiveQueue(formData.doctorId);
      setQueue(res.data.patients || []);
    } catch (err) {
      console.error("Queue error:", err);
      setQueue([]);
      setError(
        err.response?.data?.message || err.message || "Unable to load queue"
      );
    } finally {
      setLoading(false);
    }
  };

  // ================= FETCH PATIENTS =================
  const fetchPatients = async () => {
    try {
      const res = await getPatients();
      setPatients(res.data || []);
    } catch (err) {
      console.error("Patients error:", err);
      setPatients([]);
    }
  };

  // ================= FETCH DOCTORS =================
  const fetchDoctors = async () => {
    try {
      const res = await getDoctors();
      setDoctors(res.data || []);
    } catch (err) {
      console.error("Doctors error:", err);
      setDoctors([]);
    }
  };

  useEffect(() => {
    fetchQueue();
    fetchPatients();
    fetchDoctors();
  }, []);

  // ================= INPUT =================
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // ================= ADD TO QUEUE =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await addToQueue(formData);

      setFormData({
        patientId: "",
        doctorId: "",
      });

      setShowForm(false);
      fetchQueue();

    } catch (err) {
      console.error("Add queue error:", err);
    }
  };



  // ================= STATS =================
  const waitingPatients = queue.filter(
    (item) => item.status === "pending"
  ).length;

  const activePatients = queue.filter(
    (item) => item.status === "approved"
  ).length;

  return (
    <div className="queue">
      {loading && <div className="panel-empty">Loading queue...</div>}
      {!loading && error && (
        <div className="panel-error">{error}</div>
      )}

 

      {/* ================= ANALYTICS ================= */}
      <div className="queue-stats">

        <div className="stat-card">
          <div className="stat-icon blue">
            <ClipboardList size={22} />
          </div>

          <div>
            <h3>{queue.length}</h3>
            <p>Total Queue</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon yellow">
            <Clock3 size={22} />
          </div>

          <div>
            <h3>{waitingPatients}</h3>
            <p>Waiting Patients</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <CheckCircle2 size={22} />
          </div>

          <div>
            <h3>{activePatients}</h3>
            <p>In Consultation</p>
          </div>
        </div>

      </div>

      {/* ================= CONTROL PANEL ================= */}
      <div className="queue-control-card">

        <div className="section-header">
          <div>
            <h2>Queue Assignment</h2>
            <p>Assign walk-in patients to doctor queues</p>
          </div>

          <button
            className="btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Close Form" : "Add to Queue"}
          </button>
        </div>

        {showForm && (
          <form className="queue-form" onSubmit={handleSubmit}>

            <div className="input-group">
              <label>Patient</label>

              <div className="input-wrapper">
                <UserRound size={18} />

                <select
                  name="patientId"
                  value={formData.patientId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Patient</option>

                  {patients.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.username}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="input-group">
              <label>Doctor</label>

              <div className="input-wrapper">
                <Stethoscope size={18} />

                <select
                  name="doctorId"
                  value={formData.doctorId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Doctor</option>

                  {doctors.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.username}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button className="btn-primary full-btn" type="submit">
              <PlusCircle size={18} />
              Add Patient to Queue
            </button>

          </form>
        )}
      </div>

      {/* ================= LIVE QUEUE ================= */}
      <div className="queue-table-card">

        <div className="section-header">
          <div>
            <h2>Live Queue Status</h2>
            <p>Monitor current patient flow and consultations</p>
          </div>
        </div>

        {queue.length === 0 ? (
          <div className="empty-state">
            No active queue entries available.
          </div>
        ) : (
          <div className="queue-table">

            <div className="table-head">
              <span>Token</span>
              <span>Patient</span>
              <span>Status</span>
              <span>Info</span>
            </div>

            {queue.map((item) => (
              <div key={item._id} className="table-row">

                <div className="queue-token">
                  #{item.queueNumber}
                </div>

                <div className="patient-info">
                  <strong>{item.patientId?.username}</strong>
                  <small>{item.doctorId?.username || "Assigned Doctor"}</small>
                </div>

                <div>
                  <span className={`status-badge ${item.status}`}>
                    {item.status}
                  </span>
                </div>

                <div className="table-actions">
                  <span className="admin-hint">
                    Queue actions are handled by doctors.
                  </span>
                </div>

              </div>
            ))}

          </div>
        )}

      </div>

    </div>
  );
};

export default Queue;