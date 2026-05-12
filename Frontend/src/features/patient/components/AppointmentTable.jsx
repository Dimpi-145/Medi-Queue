import React, { useState } from "react";
import toast from "react-hot-toast";
import "./AppointmentTable.scss";

const AppointmentTable = ({ appointments, loading, onCancel }) => {
  const [isCancelling, setIsCancelling] = useState(null);

  const handleCancelClick = async (appointmentId) => {
    if (!onCancel) return;

    const confirmed = window.confirm(
      "Are you sure you want to cancel this appointment?"
    );
    if (!confirmed) return;

    try {
      setIsCancelling(appointmentId);
      await onCancel(appointmentId);
      toast.success("Appointment cancelled successfully");
    } catch (err) {
      toast.error("Unable to cancel appointment. Please try again.");
    } finally {
      setIsCancelling(null);
    }
  };

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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((app) => {
              const appointmentId = app.id || app._id;
              return (
                <tr key={appointmentId}>
                  <td>{app.doctor}</td>
                  <td>{app.date}</td>
                  <td>{app.time}</td>
                  <td>{app.status}</td>
                  <td>
                    {["pending", "approved"].includes(app.status) && (
                      <button
                        className="cancel-btn"
                        onClick={() => handleCancelClick(appointmentId)}
                        disabled={isCancelling === appointmentId}
                      >
                        {isCancelling === appointmentId ? "Cancelling..." : "Cancel Appointment"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Cancel Confirmation Modal */}

    </div>
  );
};

export default AppointmentTable;