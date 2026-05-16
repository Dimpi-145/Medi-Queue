import React, { useState, useEffect, useMemo } from "react";
import { getDoctors } from "../services/appointment.api";
import { getHospitals } from "../../auth/services/auth.api";
import {
  X,
  Calendar,
  Clock3,
  UserRound,
  Stethoscope,
  CheckCircle2,
} from "lucide-react";

import "./AppointmentForm.scss";

const toLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const AppointmentForm = ({ onBook, loading, onClose }) => {
  const today = useMemo(() => new Date(), []);
  const bookingWindowDays = 30;
  const [hospitals, setHospitals] = useState([]);
  const [hospitalId, setHospitalId] = useState("");
  const [department, setDepartment] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [timeSlot] = useState("09:00");
  const [reason, setReason] = useState("");
  const [success, setSuccess] = useState(false);

  // ================= FETCH HOSPITALS =================
  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const res = await getHospitals();
        setHospitals(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("Hospital Fetch Error:", err);
        setHospitals([]);
      }
    };

    fetchHospitals();
  }, []);

  // ================= FETCH DOCTORS =================
  useEffect(() => {
    if (!hospitalId) return;

    const fetchDoctors = async () => {
      try {
        const res = await getDoctors({ hospitalId, department });
        setDoctors(res.data || []);
      } catch (err) {
        console.error("Doctor Fetch Error:", err);
        setDoctors([]);
      }
    };

    fetchDoctors();
  }, [hospitalId, department]);

  const departments = useMemo(
    () =>
      Array.from(
        new Set(
          (doctors || []).map((doc) => doc.specialization).filter(Boolean),
        ),
      ).sort(),
    [doctors],
  );

  // ================= SELECTED DOCTOR =================
  const selectedDoctor = doctors.find((doc) => doc._id === doctorId);

  const selectedTimeWindow = useMemo(() => {
    if (!selectedDoctor || !date) return null;

    const selectedDayName = new Date(`${date}T00:00:00`)
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();

    const weeklySlot = (selectedDoctor.schedule?.weekly || []).find(
      (slot) => String(slot.day || "").toLowerCase() === selectedDayName,
    );

    const isToday = date === toLocalDateString(new Date());
    const start = isToday
      ? selectedDoctor.schedule?.todayStart || weeklySlot?.start || ""
      : weeklySlot?.start || selectedDoctor.schedule?.todayStart || "";
    const end = isToday
      ? selectedDoctor.schedule?.todayEnd || weeklySlot?.end || ""
      : weeklySlot?.end || selectedDoctor.schedule?.todayEnd || "";

    if (!start || !end) return null;

    return { start, end };
  }, [selectedDoctor, date]);

  const availableDates = useMemo(() => {
    if (!selectedDoctor?.schedule?.weekly?.length) return [];

    const allowedDays = new Set(
      selectedDoctor.schedule.weekly.map((slot) =>
        String(slot.day || "").toLowerCase(),
      ),
    );

    const options = [];
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);

    for (let offset = 0; offset < bookingWindowDays; offset += 1) {
      const candidate = new Date(start);
      candidate.setDate(start.getDate() + offset);

      const weekday = candidate
        .toLocaleDateString("en-US", { weekday: "long" })
        .toLowerCase();

      if (!allowedDays.has(weekday)) continue;

      if (offset === 0 && selectedDoctor.schedule.isActiveToday === false) {
        continue;
      }

      const isoDate = toLocalDateString(candidate);
      options.push({
        value: isoDate,
        label: candidate.toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      });
    }

    return options;
  }, [selectedDoctor, today]);

  useEffect(() => {
    if (!availableDates.length) {
      setDate("");
      return;
    }

    if (!availableDates.some((option) => option.value === date)) {
      setDate(availableDates[0].value);
    }
  }, [availableDates, date]);

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!hospitalId || !department || !doctorId || !date) {
      alert("Please fill all required fields");
      return;
    }

    if (
      availableDates.length &&
      !availableDates.some((option) => option.value === date)
    ) {
      alert("Please select an available date within the next 30 days.");
      return;
    }

    try {
      await onBook({
        hospitalId,
        doctorId,
        date,
        timeSlot,
        reason,
      });

      setSuccess(true);

      // reset form
      setHospitalId("");
      setDepartment("");
      setDoctorId("");
      setDate("");
      setReason("");
    } catch (err) {
      console.error("[AppointmentForm] booking error:", err);
      const errorMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to book appointment";
      alert("Error: " + errorMsg);
    }
  };

  // ================= SUCCESS SCREEN =================
  if (success) {
    return (
      <div className="booking-panel success-screen">
        <div className="success-icon">
          <CheckCircle2 size={70} />
        </div>

        <h2>Appointment Confirmed</h2>

        <p>Your appointment has been booked successfully.</p>

        <button className="primary-button" onClick={() => setSuccess(false)}>
          Book Another Appointment
        </button>
      </div>
    );
  }

  return (
    <div className="booking-panel">
      {/* HEADER */}
      <div className="booking-header">
        <div>
          <p className="eyebrow">Book Appointment</p>
          <h2>Schedule a Visit</h2>
        </div>

        <button type="button" className="close-button" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <form className="appointment-form" onSubmit={handleSubmit}>
        {/* HOSPITAL */}
        <label>
          Hospital
          <select
            value={hospitalId}
            onChange={(e) => {
              setHospitalId(e.target.value);
              setDepartment("");
              setDoctorId("");
            }}
          >
            <option value="">Select Hospital</option>
            {hospitals.map((hospital) => (
              <option key={hospital._id} value={hospital._id}>
                {hospital.name}
              </option>
            ))}
          </select>
        </label>

        {/* DEPARTMENT */}
        <label>
          Department
          <select
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              setDoctorId("");
            }}
            disabled={!hospitalId}
          >
            <option value="">Select Department</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </label>

        {/* DOCTOR */}
        <label>
          Doctor
          <select
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            disabled={!hospitalId || !department}
          >
            <option value="">Select Doctor</option>

            {doctors.map((doc) => (
              <option key={doc._id} value={doc._id}>
                {doc.username}
              </option>
            ))}
          </select>
        </label>

        {/* DOCTOR CARD */}
        {selectedDoctor && (
          <div className="doctor-preview-card">
            <div className="doctor-avatar">
              <UserRound size={28} />
            </div>

            <div className="doctor-details">
              <h4>{selectedDoctor.username}</h4>

              <p>
                <Stethoscope size={14} />
                {department}
              </p>

              <span>
                {hospitals.find((h) => h._id === hospitalId)?.name ||
                  "Selected Hospital"}
              </span>
            </div>
          </div>
        )}

        {/* DATE */}
        <label>
          Date
          <div className="input-icon date-select-wrap">
            <Calendar size={18} />

            <select
              className="date-select"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={!selectedDoctor}
            >
              <option value="">Select Available Date</option>
              {availableDates.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </label>

        {selectedDoctor && !availableDates.length && (
          <p className="time-note">
            No available dates in the next 30 days for this doctor.
          </p>
        )}

        {/* APPOINTMENT TIME INFO */}
        <div className="time-range-section">
          <p className="slot-title">
            <Clock3 size={16} />
            Appointment Time
          </p>

          {selectedTimeWindow ? (
            <p className="time-note">
              {`${selectedTimeWindow.start} to ${selectedTimeWindow.end}`}
            </p>
          ) : (
            <p className="time-note">
              Select a valid date to see the doctor’s available time window.
            </p>
          )}
        </div>

        {/* REASON */}
        <label>
          Reason
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows="3"
            placeholder="Describe symptoms or consultation purpose..."
          />
        </label>

        <button
          type="submit"
          className="primary-button submit-button"
          disabled={loading}
        >
          {loading ? "Booking..." : "Confirm Appointment"}
        </button>
      </form>
    </div>
  );
};

export default AppointmentForm;
