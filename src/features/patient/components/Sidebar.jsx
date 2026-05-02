import React from 'react'
import './Sidebar.scss'

const navItems = [
  'Dashboard',
  'My Appointments',
  'Prescriptions',
  'Reports',
  'Queue Status',
  'History',
]

const Sidebar = ({ activeItem, onSelect }) => {
  return (
    <aside className="patient-sidebar">
      <div className="sidebar-brand">
        <h2>MediQueue</h2>
        <p>Patient portal</p>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item}
            className={`sidebar-link ${activeItem === item ? 'active' : ''}`}
            onClick={() => onSelect(item)}
          >
            {item}
          </button>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
