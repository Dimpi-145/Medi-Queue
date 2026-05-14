// components/Sidebar.jsx
import React from "react";
import "./Sidebar.scss";

const Sidebar = ({ currentPage, setCurrentPage }) => {
  const menuItems = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'patients', label: 'Patients' },
    { key: 'doctors', label: 'Doctors' },
    { key: 'appointments', label: 'Appointments' },
    { key: 'queue', label: 'Queue' },
    { key: 'prescriptions', label: 'Prescriptions' },
    { key: 'reports', label: 'Reports' },
  ];

  return (
    <aside className="sidebar">
      <h2>MediQueue</h2>

      <ul>
        {menuItems.map(item => (
          <li
            key={item.key}
            className={currentPage === item.key ? 'active' : ''}
            onClick={() => setCurrentPage(item.key)}
          >
            {item.label}
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default Sidebar;