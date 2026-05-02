import React from "react";
import "./AppointmentTable.scss";

const AppointmentTable = ({ appointments, loading }) => {
  if (loading) return <p>Loading...</p>;

  return (
    <div className="appointment-table">
      <h3>My Appointments</h3>
      {appointments.length === 0 ? (
        <p>No appointments found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Doctor</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((app) => (
              <tr key={app.id}>
                <td>{app.doctor}</td>
                <td>{app.date}</td>
                <td>{app.time}</td>
                <td>{app.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AppointmentTable;