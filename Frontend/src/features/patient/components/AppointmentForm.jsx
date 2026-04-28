import React, { useState } from 'react'
import './AppointmentForm.scss'

const AppointmentForm = ({ onBook, loading }) => {
  const [doctor, setDoctor] = useState('Dr. Samuel King')
  const [date, setDate] = useState('2026-05-20')
  const [time, setTime] = useState('10:00')
  const [reason, setReason] = useState('Routine check-up')
  const [success, setSuccess] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    const newAppointment = {
      doctor,
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: `${time}`,
      status: 'waiting',
    }
    onBook(newAppointment)
    setSuccess('Appointment request submitted successfully.')
    setReason('Routine check-up')
  }

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
          <select value={doctor} onChange={(e) => setDoctor(e.target.value)}>
            <option>Dr. Samuel King</option>
            <option>Dr. Nina Patel</option>
            <option>Dr. Lewis Carter</option>
          </select>
        </label>

        <label>
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>

        <label>
          Time
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </label>

        <label>
          Reason
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows="3" />
        </label>

        <button type="submit" className="primary-button" disabled={loading}>
          {loading ? 'Loading...' : 'Book Appointment'}
        </button>
      </form>
      {success && <p className="success-note">{success}</p>}
    </div>
  )
}

export default AppointmentForm
