// pages/Queue.jsx
import React, { useState, useEffect } from 'react';
import { getLiveQueue, addToQueue, getPatients, getDoctors } from '../services/api';

const Queue = () => {
  const [queue, setQueue] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
  });

  useEffect(() => {
    fetchQueue();
    fetchPatients();
    fetchDoctors();
  }, []);

  const fetchQueue = async () => {
    try {
      const response = await getLiveQueue();
      setQueue(response.data);
    } catch (error) {
      console.error('Error fetching queue:', error);
      // Mock data
      setQueue([
        { id: 1, patientName: 'John Doe', doctorName: 'Dr. Smith', queueNumber: 1, status: 'waiting' },
        { id: 2, patientName: 'Jane Smith', doctorName: 'Dr. Johnson', queueNumber: 2, status: 'called' },
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
      await addToQueue(formData);
      setFormData({
        patientId: '',
        doctorId: '',
      });
      setShowForm(false);
      fetchQueue();
    } catch (error) {
      console.error('Error adding to queue:', error);
    }
  };

  const callNext = async (queueId) => {
    // Implement call next functionality
    console.log('Calling next patient:', queueId);
  };

  const completeVisit = async (queueId) => {
    // Implement complete visit functionality
    console.log('Completing visit:', queueId);
  };

  return (
    <div className="queue">
      <div className="header">
        <h2>Queue Management</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add to Queue'}
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
          <button type="submit" className="btn-primary">Add to Queue</button>
        </form>
      )}

      <div className="queue-list">
        {doctors.map(doctor => (
          <div key={doctor.id} className="doctor-queue">
            <h3>{doctor.name}</h3>
            <div className="queue-items">
              {queue
                .filter(item => item.doctorId === doctor.id)
                .map(item => (
                  <div key={item.id} className={`queue-item ${item.status}`}>
                    <div className="queue-number">#{item.queueNumber}</div>
                    <div className="patient-info">
                      <p>{item.patientName}</p>
                      <span className="status">{item.status}</span>
                    </div>
                    <div className="actions">
                      {item.status === 'waiting' && (
                        <button className="btn-primary" onClick={() => callNext(item.id)}>
                          Call Next
                        </button>
                      )}
                      {item.status === 'called' && (
                        <button className="btn-success" onClick={() => completeVisit(item.id)}>
                          Complete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Queue;