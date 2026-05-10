import React, { useEffect, useMemo, useState } from "react";
import "./AppointmentForm.scss";
import { getDoctors } from "../../auth/services/auth.api";

const AppointmentForm = ({ onBook, loading }) => {
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("2026-05-20");
  const [time, setTime] = useState("10:00");
  const [reason, setReason] = useState("Routine check-up");
  const [success, setSuccess] = useState("");
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [doctorError, setDoctorError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadDoctors = async () => {
      try {
        const response = await getDoctors();

        if (!isMounted) {
          return;
        }

        const doctorList = response.doctors || [];
        setDoctors(doctorList);
        setDoctorId((previous) => previous || doctorList[0]?._id || "");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setDoctorError(
          error.response?.data?.message || "Unable to load doctors.",
        );
      } finally {
        if (isMounted) {
          setLoadingDoctors(false);
        }
      }
    };

    loadDoctors();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedDoctor = useMemo(
    () => doctors.find((item) => item._id === doctorId),
    [doctorId, doctors],
  );

  const formatDoctorLabel = (doctor) => {
    const name = doctor.username?.startsWith("Dr.")
      ? doctor.username
      : `Dr. ${doctor.username}`;

    return doctor.specialization ? `${name} - ${doctor.specialization}` : name;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!doctorId) {
      setDoctorError("Please select a doctor.");
      return;
    }

    const newAppointment = {
      doctorId,
      doctor: selectedDoctor?.username || "Selected Doctor",
      date: new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      time: `${time}`,
      status: "waiting",
    };
    onBook(newAppointment);
    setSuccess("Appointment request submitted successfully.");
    setReason("Routine check-up");
  };

  return (
    <div className="booking-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Book Appointment</p>
          <h2>Schedule a Visit</h2>
        </div>
      </div>
      <form className="appointment-form" onSubmit={handleSubmit}>
        <label>
          Doctor
          <select
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            disabled={loadingDoctors}
          >
            <option value="">
              {loadingDoctors ? "Loading doctors..." : "Select a doctor"}
            </option>
            {doctors.map((doctorItem) => (
              <option key={doctorItem._id} value={doctorItem._id}>
                {formatDoctorLabel(doctorItem)}
              </option>
            ))}
          </select>
        </label>

        <label>
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>

        <label>
          Time
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </label>

        <label>
          Reason
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows="3"
          />
        </label>

        <button type="submit" className="primary-button" disabled={loading}>
          {loading ? "Loading..." : "Book Appointment"}
        </button>
      </form>
      {doctorError && <p className="success-note">{doctorError}</p>}
      {success && <p className="success-note">{success}</p>}
    </div>
  );
};

export default AppointmentForm;
