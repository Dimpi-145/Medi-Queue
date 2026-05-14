import React, { useState, useEffect } from "react";
import { getDashboardStats } from "../services/api";
import "./Dashboard.scss";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    patientsInQueue: 0,
    appointmentsToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getDashboardStats();
      setStats(res.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
      setError(
        error.response?.data?.message || error.message || "Failed to load stats"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <h2>Dashboard Overview</h2>

      {loading && <div className="panel-empty">Loading dashboard data...</div>}
      {!loading && error && (
        <div className="panel-error">{error}</div>
      )}

      {!loading && !error && (
        <div className="cards">
        <div className="card">
          <h3>Total Patients</h3>
          <p>{stats.totalPatients}</p>
        </div>

        <div className="card">
          <h3>Total Doctors</h3>
          <p>{stats.totalDoctors}</p>
        </div>

        <div className="card">
          <h3>Patients in Queue</h3>
          <p>{stats.patientsInQueue}</p>
        </div>

        <div className="card">
          <h3>Appointments Today</h3>
          <p>{stats.appointmentsToday}</p>
        </div>
      </div>
      )}
    </div>
  );
};

export default Dashboard;