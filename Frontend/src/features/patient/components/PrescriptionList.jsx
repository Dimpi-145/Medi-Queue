import React from 'react'
import './PrescriptionList.scss'

const PrescriptionList = ({ prescriptions, loading }) => {
  return (
    <section className="card-panel prescriptions-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Prescriptions</p>
          <h2>Active Scripts</h2>
        </div>
        <button className="ghost-button">Download All</button>
      </div>
      {loading ? (
        <div className="panel-empty">Loading prescriptions...</div>
      ) : prescriptions.length === 0 ? (
        <div className="panel-empty">No prescriptions available.</div>
      ) : (
        <div className="prescription-list">
          {prescriptions.map((prescription, index) => (
            <article key={index} className="prescription-card">
              <div>
                <h4>{prescription.doctor}</h4>
                <p>{prescription.date}</p>
                <p className="preview">{prescription.preview}</p>
              </div>
              <button className="secondary-button">Download PDF</button>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default PrescriptionList
