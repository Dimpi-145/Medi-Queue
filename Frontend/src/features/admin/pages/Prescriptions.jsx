// pages/Prescriptions.jsx
import React, { useState, useEffect } from 'react';

const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      // Assuming there's an API for prescriptions
      // const response = await getPrescriptions();
      // setPrescriptions(response.data);

      // Mock data for now
      setPrescriptions([
        { id: 1, patientName: 'John Doe', doctorName: 'Dr. Smith', date: '2024-04-27', fileName: 'prescription_001.pdf' },
        { id: 2, patientName: 'Jane Smith', doctorName: 'Dr. Johnson', date: '2024-04-26', fileName: 'prescription_002.pdf' },
      ]);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    }
  };

  const downloadPrescription = (fileName) => {
    // Implement download functionality
    console.log('Downloading:', fileName);
  };

  return (
    <div className="prescriptions">
      <h2>Prescription Management</h2>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {prescriptions.map(prescription => (
              <tr key={prescription.id}>
                <td>{prescription.id}</td>
                <td>{prescription.patientName}</td>
                <td>{prescription.doctorName}</td>
                <td>{prescription.date}</td>
                <td>
                  <button
                    className="btn-primary"
                    onClick={() => downloadPrescription(prescription.fileName)}
                  >
                    Download PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Prescriptions;