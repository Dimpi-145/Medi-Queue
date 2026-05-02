import React from "react";
import "./Sidebar.scss";

const Sidebar = ({ activeSection, setActiveSection }) => {
  const navItems = [
    { key: "Dashboard", label: "Dashboard" },
    { key: "Appointments", label: "Appointments" },
    { key: "Queue", label: "Queue" },
    { key: "History", label: "History" },
  ];

  return (
    <aside className="doctor-sidebar">
      <div className="sidebar-brand">
        <span className="brand-dot" />
        <h3>Doctor Panel</h3>
      </div>

      <nav>
        <ul>
          {navItems.map((item) => (
            <li
              key={item.key}
              className={activeSection === item.key ? "active" : ""}
              onClick={() => setActiveSection(item.key)}
            >
              {item.label}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
