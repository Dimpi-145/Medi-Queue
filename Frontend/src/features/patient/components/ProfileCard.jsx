import React from 'react'
import './ProfileCard.scss'

const ProfileCard = ({ patient, loading, appointmentsCount, reportsAvailable, onBookClick }) => {
  return (
    <section className="card-panel profile-card">
      <div className="profile-header">
        <div>
          <p className="eyebrow">Patient Profile</p>
          <h2>My Health Summary</h2>
        </div>
        <button className="book-btn" onClick={onBookClick}>
          Book Appointment
        </button>
      </div>
      {loading ? (
        <div className="panel-empty">Loading profile...</div>
      ) : (
        <>
          <div className="patient-info">
            <img src={patient.avatar} alt="Patient avatar" />
            <div>
              <h3>{patient.name}</h3>
              <p>{patient.email}</p>
            </div>
          </div>

          <div className="patient-details">
            <div>
              <span>Age</span>
              <strong>{patient.age}</strong>
            </div>
            <div>
              <span>Gender</span>
              <strong>{patient.gender}</strong>
            </div>
            <div>
              <span>Phone</span>
              <strong>{patient.phone}</strong>
            </div>
          </div>

          <div className="metric-grid">
            <div className="metric-card">
              <p>Appointments</p>
              <strong>{appointmentsCount}</strong>
            </div>
            <div className="metric-card">
              <p>Reports</p>
              <strong>{reportsAvailable}</strong>
            </div>
          </div>
        </>
      )}
    </section>
  )
}

// export default ProfileCard
// import React from 'react'
// import './ProfileCard.scss'

// const ProfileCard = ({ patient, loading, appointmentsCount, reportsAvailable }) => {
//   return (
//     <section className="card-panel profile-card">

//       {/* 🔥 HEADER WITH BUTTON */}
//       <div className="profile-header">
//         <div>
//           <p className="eyebrow">Patient Profile</p>
//           <h2>My Health Summary</h2>
//         </div>

//         <button className="book-btn">
//           Book Appointment
//         </button>
//       </div>

//       {loading ? (
//         <div className="panel-empty">Loading profile...</div>
//       ) : (
//         <>
//           <div className="patient-info">
//             <img src={patient?.avatar} alt="Patient avatar" />
//             <div>
//               <h3>{patient?.name}</h3>
//               <p>{patient?.email}</p>
//             </div>
//           </div>

//           <div className="patient-details">
//             <div>
//               <span>Age</span>
//               <strong>{patient?.age}</strong>
//             </div>
//             <div>
//               <span>Gender</span>
//               <strong>{patient?.gender}</strong>
//             </div>
//             <div>
//               <span>Phone</span>
//               <strong>{patient?.phone}</strong>
//             </div>
//           </div>

//           <div className="metric-grid">
//             <div className="metric-card">
//               <p>Appointments</p>
//               <strong>{appointmentsCount}</strong>
//             </div>
//             <div className="metric-card">
//               <p>Reports</p>
//               <strong>{reportsAvailable}</strong>
//             </div>
//           </div>
//         </>
//       )}
//     </section>
//   )
// }

export default ProfileCard