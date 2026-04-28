// pages/Patients.jsx
import React, { useState, useEffect } from 'react';
import { getPatients, createPatient, getDoctors } from '../services/api';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: '',
    gender: '',
    phone: '',
    doctorId: '',
  });

  useEffect(() => {
    fetchPatients();
    fetchDoctors();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await getPatients();
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
      // Mock data
      setPatients([
        { id: 1, name: 'John Doe', email: 'john@example.com', age: 30, gender: 'Male', phone: '1234567890' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 25, gender: 'Female', phone: '0987654321' },
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
      await createPatient(formData);
      setFormData({
        name: '',
        email: '',
        age: '',
        gender: '',
        phone: '',
        doctorId: '',
      });
      setShowForm(false);
      fetchPatients();
    } catch (error) {
      console.error('Error creating patient:', error);
    }
  };

  return (
    <div className="patients">
      <div className="header">
        <h2>Patient Management</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add New Patient'}
        </button>
      </div>

      {showForm && (
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Age:</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Gender:</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label>Phone:</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Assign Doctor:</label>
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
          <button type="submit" className="btn-primary">Register Patient</button>
        </form>
      )}

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Age</th>
              <th>Gender</th>
              <th>Phone</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {patients.map(patient => (
              <tr key={patient.id}>
                <td>{patient.id}</td>
                <td>{patient.name}</td>
                <td>{patient.email}</td>
                <td>{patient.age}</td>
                <td>{patient.gender}</td>
                <td>{patient.phone}</td>
                <td>
                  <button className="btn-secondary">Edit</button>
                  <button className="btn-danger">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Patients;