import React, { useState, useEffect } from "react";
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

  const [formData, setFormData] = useState({
    patientId: "",
    doctorId: "",
  });

  // ================= FETCH QUEUE =================
  const fetchQueue = async () => {
  try {
    const res = await getLiveQueue(formData.doctorId);

    console.log("🧨 QUEUE RESPONSE:", res.data);

    setQueue(res.data.patients || []);
  } catch (err) {
    console.error("Queue error:", err);
    setQueue([]);
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
  // const handleSubmit = async (e) => {
  //   e.preventDefault();

  //   try {
  //     await addToQueue(formData);

  //     setFormData({
  //       patientId: "",
  //       doctorId: "",
  //     });

  //     setShowForm(false);
  //     fetchQueue();
  //   } catch (err) {
  //     console.error("Add queue error:", err);
  //   }
  // };
const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    console.log("🧨 SENDING TO QUEUE:", formData);

    const res = await addToQueue(formData);

    console.log("✅ QUEUE RESPONSE:", res.data);

    setFormData({
      patientId: "",
      doctorId: "",
    });

    setShowForm(false);
    fetchQueue();

  } catch (err) {
    console.error("❌ Add queue error:", err);
    console.error("❌ Backend response:", err.response?.data);
  }
};

  // ================= CALL NEXT (FIXED) =================
  const callNext = async () => {
    try {
      await api.put("/queue/next");
      fetchQueue();
    } catch (err) {
      console.error("Call next error:", err);
    }
  };

  // ================= COMPLETE VISIT =================
  const completeVisit = async (id) => {
    try {
      await api.put(`/queue/complete/${id}`);
      fetchQueue();
    } catch (err) {
      console.error("Complete error:", err);
    }
  };

  return (
    <div className="queue">

      {/* ================= HEADER ================= */}
      <div className="header">
        <h2>Queue Management</h2>

        <button
          className="btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "Add to Queue"}
        </button>
      </div>

      {/* ================= FORM ================= */}
      {showForm && (
        <form className="form" onSubmit={handleSubmit}>

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

          <button className="btn-primary" type="submit">
            Add
          </button>
        </form>
      )}

      {/* ================= QUEUE LIST ================= */}
      <div className="queue-list">

        {queue.map((item) => (
          <div key={item._id} className={`queue-item ${item.status}`}>

            <div>
              <b>#{item.queueNumber}</b>
            </div>

            <div>
              <p>{item.patientId?.username}</p>
              <small>{item.status}</small>
            </div>

            <div>
              {/* CALL NEXT (no doctorId needed) */}
              {item.status === "pending" && (
                <button
                  className="btn-primary"
                  onClick={callNext}
                >
                  Call Next
                </button>
              )}

              {/* COMPLETE VISIT */}
              {item.status === "approved" && (
                <button
                  className="btn-success"
                  onClick={() => completeVisit(item._id)}
                >
                  Complete
                </button>
              )}
            </div>

          </div>
        ))}

      </div>
    </div>
  );
};

export default Queue;