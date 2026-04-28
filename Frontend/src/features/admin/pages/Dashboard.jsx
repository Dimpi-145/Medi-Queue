// pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../services/api';

const Dashboard = () => {
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
      const response = await getDashboardStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Mock data for now
      setStats({
        totalPatients: 150,
        totalDoctors: 12,
        patientsInQueue: 8,
        appointmentsToday: 25,
      });
    }
  };

  return (
    <div className="dashboard">
      <h2>Dashboard Overview</h2>

      <div className="cards">
        <div className="card">
          <h3>Total Patients</h3>
          <p className="stat">{stats.totalPatients}</p>
        </div>
        <div className="card">
          <h3>Total Doctors</h3>
          <p className="stat">{stats.totalDoctors}</p>
        </div>
        <div className="card">
          <h3>Patients in Queue</h3>
          <p className="stat">{stats.patientsInQueue}</p>
        </div>
        <div className="card">
          <h3>Appointments Today</h3>
          <p className="stat">{stats.appointmentsToday}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;