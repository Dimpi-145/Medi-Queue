import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import ProfileCard from '../components/ProfileCard'
import QueueList from '../components/QueueList'
import AppointmentTable from '../components/AppointmentTable'
import PrescriptionList from '../components/PrescriptionList'
import AppointmentForm from '../components/AppointmentForm'
import '../../shared/global.scss'
import '../patientDashboard.scss'

const PatientDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Dashboard')
  const [patient, setPatient] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [reports, setReports] = useState([])
  const [history, setHistory] = useState([])
  const [queue, setQueue] = useState([])
  const [showAppointmentModal, setShowAppointmentModal] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setPatient({
        name: 'Amara Johnson',
        email: 'amara.johnson@example.com',
        age: 29,
        gender: 'Female',
        phone: '+1 (555) 781-2234',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
      })

      setAppointments([
        { doctor: 'Dr. Samuel King', date: 'May 8, 2026', time: '10:30 AM', status: 'approved' },
        { doctor: 'Dr. Nina Patel', date: 'Jun 1, 2026', time: '02:00 PM', status: 'waiting' },
        { doctor: 'Dr. Lewis Carter', date: 'Jun 20, 2026', time: '09:15 AM', status: 'waiting' },
      ])

      setPrescriptions([
        { doctor: 'Dr. Samuel King', date: 'Apr 10, 2026', preview: 'Take one tablet twice daily for blood pressure control.', id: 'RX-9182' },
        { doctor: 'Dr. Nina Patel', date: 'Mar 25, 2026', preview: 'Apply cream to affected area once daily for 7 days.', id: 'RX-8427' },
      ])

      setReports([
        { name: 'Lab Work Summary', date: 'Apr 5, 2026', type: 'Blood panel' },
        { name: 'X-Ray Report', date: 'Mar 18, 2026', type: 'Chest scan' },
      ])

      setHistory([
        { doctor: 'Dr. Samuel King', date: 'Apr 10, 2026', status: 'completed' },
        { doctor: 'Dr. Nina Patel', date: 'Mar 25, 2026', status: 'completed' },
        { doctor: 'Dr. Lewis Carter', date: 'Feb 14, 2026', status: 'completed' },
      ])

      setQueue([
        { name: 'Jade Walker', number: '12', status: 'waiting' },
        { name: 'Amara Johnson', number: '13', status: 'called' },
        { name: 'Marcus Reed', number: '14', status: 'waiting' },
        { name: 'Sara Kim', number: '15', status: 'waiting' },
        { name: 'Liam Brooks', number: '16', status: 'completed' },
      ])

      setLoading(false)
    }, 700)

    return () => clearTimeout(timer)
  }, [])

  const appointmentsCount = appointments.length
  const reportsAvailable = reports.length
  const currentQueueNumber = queue.find((item) => item.name === patient?.name)?.number || '-'
  const patientsAhead = queue.filter(
    (item) => item.status === 'waiting' && patient?.name && Number(item.number) < Number(currentQueueNumber),
  ).length

  const handleBookAppointment = (newAppointment) => {
    setAppointments((previous) => [newAppointment, ...previous])
  }

  return (
    <div className="patient-dashboard">
      <Navbar patient={patient} loading={loading} onLogout={() => {}} />
      <div className="dashboard-shell">
        <Sidebar activeItem={activeTab} onSelect={setActiveTab} />

        <main className="dashboard-content">
          {activeTab === 'Dashboard' && (
            <div className="dashboard-main-grid">
              <ProfileCard
                patient={patient}
                loading={loading}
                appointmentsCount={appointmentsCount}
                reportsAvailable={reportsAvailable}
                onBookClick={() => setShowAppointmentModal(true)}
              />
            </div>
          )}

          {activeTab === 'My Appointments' && (
            <AppointmentTable appointments={appointments} loading={loading} />
          )}

          {activeTab === 'Prescriptions' && (
            <PrescriptionList prescriptions={prescriptions} loading={loading} />
          )}

          {activeTab === 'Reports' && (
            <section className="card-panel reports-panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Medical Reports</p>
                  <h2>Reports</h2>
                </div>
              </div>
              {loading ? (
                <div className="panel-empty">Loading reports...</div>
              ) : reports.length === 0 ? (
                <div className="panel-empty">No reports available.</div>
              ) : (
                <div className="report-list">
                  {reports.map((item, index) => (
                    <div className="report-row" key={index}>
                      <div>
                        <h4>{item.name}</h4>
                        <p>{item.type}</p>
                      </div>
                      <button className="secondary-button">View</button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeTab === 'Queue Status' && (
            <QueueList queue={queue} loading={loading} currentQueueNumber={currentQueueNumber} patientsAhead={patientsAhead} />
          )}

          {activeTab === 'History' && (
            <section className="card-panel history-panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Visit History</p>
                  <h2>Past Visits</h2>
                </div>
              </div>
              {loading ? (
                <div className="panel-empty">Loading history...</div>
              ) : history.length === 0 ? (
                <div className="panel-empty">No visit history yet.</div>
              ) : (
                <div className="history-list">
                  {history.map((entry, index) => (
                    <div className="history-row" key={index}>
                      <div>
                        <h4>{entry.doctor}</h4>
                        <p>{entry.date}</p>
                      </div>
                      <span className={`status-badge ${entry.status}`}>{entry.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      {showAppointmentModal && (
        <div className="appointment-modal-overlay" onClick={() => setShowAppointmentModal(false)}>
          <div className="appointment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="appointment-modal-header">
              <h2>Book Appointment</h2>
              <button className="close-modal" onClick={() => setShowAppointmentModal(false)}>×</button>
            </div>
            <div className="appointment-modal-content">
              <AppointmentForm
                onBook={(appointment) => {
                  handleBookAppointment(appointment)
                  setShowAppointmentModal(false)
                }}
                loading={loading}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PatientDashboard
