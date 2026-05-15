import React, { useState, useEffect, useContext } from "react";
import { getDashboardStats } from "../services/api";
import { authContext } from "../../auth/auth.context";
import HospitalProfile from "../../hospital/components/HospitalProfile";
import "./Dashboard.scss";

const Dashboard = () => {
  const { user } = useContext(authContext);
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    patientsInQueue: 0,
    appointmentsToday: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await getDashboardStats();
      setStats(res.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const isHospitalUser = user && user.role === "hospital";

  return (
    <div className="dashboard">
      <h2>Dashboard Overview</h2>

      {isHospitalUser && (
        <div className="hospital-profile-section">
          <HospitalProfile />
        </div>
      )}

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
    </div>
  );
};

export default Dashboard;
