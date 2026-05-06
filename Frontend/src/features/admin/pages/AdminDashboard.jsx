// pages/AdminDashboard.jsx

import React, { useState } from "react";

import {
  LayoutDashboard,
  Users,
  UserRound,
  CalendarDays,
  ClipboardList,
  FileText,
  Activity,
} from "lucide-react";

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
  const [currentPage, setCurrentPage] = useState("dashboard");

  const pageConfig = {
    dashboard: {
      title: "Admin Dashboard",
      subtitle: "Hospital operations overview & analytics",
      icon: <LayoutDashboard size={22} />,
    },

    patients: {
      title: "Patients Management",
      subtitle: "Manage patient records and activity",
      icon: <Users size={22} />,
    },

    doctors: {
      title: "Doctors Management",
      subtitle: "Monitor doctors and department assignments",
      icon: <UserRound size={22} />,
    },

    appointments: {
      title: "Appointments",
      subtitle: "Track schedules and patient visits",
      icon: <CalendarDays size={22} />,
    },

    queue: {
      title: "Queue Monitoring",
      subtitle: "Live patient queue and consultation tracking",
      icon: <ClipboardList size={22} />,
    },

    prescriptions: {
      title: "Prescriptions",
      subtitle: "Digital prescriptions and medical records",
      icon: <FileText size={22} />,
    },
  };

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;

      case "patients":
        return <Patients />;

      case "doctors":
        return <Doctors />;

      case "appointments":
        return <Appointments />;

      case "queue":
        return <Queue />;

      case "prescriptions":
        return <Prescriptions />;

      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="admin-container">

      {/* SIDEBAR */}
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />

      {/* MAIN */}
      <div className="main">

        {/* TOP HEADER */}
        <Header />

        {/* PAGE HERO */}
        <div className="admin-hero">

          <div className="hero-left">

            <div className="hero-icon">
              {pageConfig[currentPage]?.icon}
            </div>

            <div>
              <p className="hero-eyebrow">
                MediQueue Admin Panel
              </p>

              <h1>
                {pageConfig[currentPage]?.title}
              </h1>

              <p className="hero-subtitle">
                {pageConfig[currentPage]?.subtitle}
              </p>
            </div>
          </div>

          <div className="hero-status">
            <Activity size={16} />
            System Active
          </div>
        </div>

        {/* CONTENT */}
        <div className="content">
          {renderPage()}
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;