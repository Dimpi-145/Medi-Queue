// pages/AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Dashboard from "./Dashboard";
import Patients from "./Patients";
import Doctors from "./Doctors";
import Appointments from "./Appointments";
import Queue from "./Queue";
import Prescriptions from "./Prescriptions";
import "../AdminDashboard.scss";

const AdminDashboard = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'patients':
        return <Patients />;
      case 'doctors':
        return <Doctors />;
      case 'appointments':
        return <Appointments />;
      case 'queue':
        return <Queue />;
      case 'prescriptions':
        return <Prescriptions />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="admin-container">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />

      <div className="main">
        <Header />

        <div className="content">
          {renderPage()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;