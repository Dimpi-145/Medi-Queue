// pages/HospitalDashboard.jsx

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

import Sidebar from "../../admin/components/Sidebar";
import Header from "../../admin/components/Header";

import Dashboard from "../../admin/pages/Dashboard";
import Patients from "../../admin/pages/Patients";
import Doctors from "../../admin/pages/Doctors";
import Appointments from "../../admin/pages/Appointments";
import Queue from "../../admin/pages/Queue";
import Prescriptions from "../../admin/pages/Prescriptions";
import HospitalReports from "../components/HospitalReports";

import "../../admin/AdminDashboard.scss";

const HospitalDashboard = () => {
  const [currentPage, setCurrentPage] = useState("dashboard");

  const pageConfig = {
    dashboard: {
      title: "Hospital Dashboard",
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

      reports: {
        title: "Medical Reports",
        subtitle: "Create and manage patient medical reports",
        icon: <FileText size={22} />,
      },
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

      case "reports":
        return <HospitalReports />;
        return <Dashboard />;
    }
  };

  return (
    <div className="admin-container">
      {/* SIDEBAR */}
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />

      {/* MAIN */}
      <div className="main">
        {/* TOP HEADER */}
        <Header title="Hospital Dashboard" roleLabel="Hospital" />

        {/* PAGE HERO */}
        <div className="admin-hero">
          <div className="hero-left">
            <div className="hero-icon">{pageConfig[currentPage]?.icon}</div>

            <div>
              <p className="hero-eyebrow">MediQueue Hospital Panel</p>

              <h1>{pageConfig[currentPage]?.title}</h1>

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
        <div className="content">{renderPage()}</div>
      </div>
    </div>
  );
};

export default HospitalDashboard;
