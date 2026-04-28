import React from 'react'
import './QueueList.scss'

const statusLabel = {
  waiting: 'waiting',
  called: 'called',
  completed: 'completed',
}

const QueueList = ({ queue, loading, currentQueueNumber, patientsAhead }) => {
  return (
    <section className="card-panel queue-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Queue Status</p>
          <h2>Current Queue</h2>
        </div>
      </div>

      <div className="queue-summary">
        <div>
          <p>Your Queue Number</p>
          <strong>#{currentQueueNumber}</strong>
        </div>
        <div>
          <p>Patients Ahead</p>
          <strong>{patientsAhead}</strong>
        </div>
      </div>

      {loading ? (
        <div className="panel-empty">Loading queue data...</div>
      ) : queue.length === 0 ? (
        <div className="panel-empty">No queue entries are available.</div>
      ) : (
        <div className="queue-list">
          {queue.map((item, index) => (
            <div
              key={index}
              className={`queue-row ${item.name === 'Amara Johnson' ? 'current' : ''}`}
            >
              <div>
                <h4>{item.name}</h4>
                <p>#{item.number}</p>
              </div>
              <span className={`status-badge ${item.status}`}>{statusLabel[item.status]}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default QueueList
