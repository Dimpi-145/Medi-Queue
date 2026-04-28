// pages/Doctors.jsx
import React, { useState, useEffect } from 'react';
import { getDoctors, createDoctor } from '../services/api';

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    specialization: '',
  });

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await getDoctors();
      setDoctors(response.data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      // Mock data
      setDoctors([
        { id: 1, name: 'Dr. Smith', email: 'smith@example.com', specialization: 'Cardiology' },
        { id: 2, name: 'Dr. Johnson', email: 'johnson@example.com', specialization: 'Neurology' },
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
      await createDoctor(formData);
      setFormData({
        name: '',
        email: '',
        specialization: '',
      });
      setShowForm(false);
      fetchDoctors();
    } catch (error) {
      console.error('Error creating doctor:', error);
    }
  };

  return (
    <div className="doctors">
      <div className="header">
        <h2>Doctor Management</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add New Doctor'}
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
            <label>Specialization:</label>
            <input
              type="text"
              name="specialization"
              value={formData.specialization}
              onChange={handleInputChange}
              required
            />
          </div>
          <button type="submit" className="btn-primary">Create Doctor</button>
        </form>
      )}

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Specialization</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map(doctor => (
              <tr key={doctor.id}>
                <td>{doctor.id}</td>
                <td>{doctor.name}</td>
                <td>{doctor.email}</td>
                <td>{doctor.specialization}</td>
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

export default Doctors;