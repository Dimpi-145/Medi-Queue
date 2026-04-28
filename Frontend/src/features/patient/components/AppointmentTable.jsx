import React from 'react'
import './AppointmentTable.scss'

const statusLabel = {
  waiting: 'waiting',
  approved: 'approved',
  completed: 'completed',
}

const AppointmentTable = ({ appointments, loading }) => {
  return (
    <section className="card-panel appointments-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Appointments</p>
          <h2>Upcoming Visits</h2>
        </div>
      </div>
      {loading ? (
        <div className="panel-empty">Loading appointments...</div>
      ) : appointments.length === 0 ? (
        <div className="panel-empty">No appointments scheduled.</div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Doctor Name</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment, index) => (
                <tr key={index}>
                  <td>{appointment.doctor}</td>
                  <td>{appointment.date}</td>
                  <td>{appointment.time}</td>
                  <td>
                    <span className={`status-badge ${appointment.status}`}>
                      {statusLabel[appointment.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default AppointmentTable
