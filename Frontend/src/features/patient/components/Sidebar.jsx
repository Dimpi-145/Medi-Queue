import React from "react";
import "./Sidebar.scss";

import {
  FaTachometerAlt,
  FaCalendarCheck,
  FaFilePrescription,
  FaFileMedical,
  FaStream,
  FaHistory,
} from "react-icons/fa";

const Sidebar = ({ activeItem, onSelect }) => {
  const items = [
    { name: "Dashboard", icon: <FaTachometerAlt /> },
    { name: "My Appointments", icon: <FaCalendarCheck /> },
    { name: "Prescriptions", icon: <FaFilePrescription /> },
    { name: "Reports", icon: <FaFileMedical /> },
    { name: "Queue Status", icon: <FaStream /> },
    { name: "History", icon: <FaHistory /> },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>MediQueue</h2>
        <p>Patient Portal</p>
      </div>

      <nav className="sidebar-menu">
        {items.map((item) => (
          <div
            key={item.name}
            className={`sidebar-item ${
              activeItem === item.name ? "active" : ""
            }`}
            onClick={() => onSelect(item.name)}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.name}</span>
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;