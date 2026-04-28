// pages/Appointments.jsx
import React, { useState, useEffect } from 'react';
import { getAppointments, bookAppointment, getPatients, getDoctors } from '../services/api';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    date: '',
    time: '',
  });

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
    fetchDoctors();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await getAppointments();
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      // Mock data
      setAppointments([
        { id: 1, patientName: 'John Doe', doctorName: 'Dr. Smith', date: '2024-04-27', time: '10:00', status: 'pending' },
        { id: 2, patientName: 'Jane Smith', doctorName: 'Dr. Johnson', date: '2024-04-27', time: '11:00', status: 'approved' },
      ]);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await getPatients();
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setPatients([
        { id: 1, name: 'John Doe' },
        { id: 2, name: 'Jane Smith' },
      ]);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await getDoctors();
      setDoctors(response.data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setDoctors([
        { id: 1, name: 'Dr. Smith' },
        { id: 2, name: 'Dr. Johnson' },
      ]);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await bookAppointment(formData);
      setFormData({
        patientId: '',
        doctorId: '',
        date: '',
        time: '',
      });
      setShowForm(false);
      fetchAppointments();
    } catch (error) {
      console.error('Error booking appointment:', error);
    }
  };

  return (
    <div className="appointments">
      <div className="header">
        <h2>Appointment Management</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Book Appointment'}
        </button>
      </div>

      {showForm && (
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Patient:</label>
            <select
              name="patientId"
              value={formData.patientId}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Patient</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.id}>{patient.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Doctor:</label>
            <select
              name="doctorId"
              value={formData.doctorId}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Doctor</option>
              {doctors.map(doctor => (
                <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Date:</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Time:</label>
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleInputChange}
              required
            />
          </div>
          <button type="submit" className="btn-primary">Book Appointment</button>
        </form>
      )}

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map(appointment => (
              <tr key={appointment.id}>
                <td>{appointment.id}</td>
                <td>{appointment.patientName}</td>
                <td>{appointment.doctorName}</td>
                <td>{appointment.date}</td>
                <td>{appointment.time}</td>
                <td>
                  <span className={`status ${appointment.status}`}>
                    {appointment.status}
                  </span>
                </td>
                <td>
                  <button className="btn-secondary">Edit</button>
                  <button className="btn-danger">Cancel</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Appointments;