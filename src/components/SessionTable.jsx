import { formatMinutes, formatSessionDate } from '../utils/dateHelpers'

function SessionTable({ sessions, onDeleteSession }) {
  if (!sessions.length) {
    return (
      <div className="empty-state">
        <h3>No sessions match these filters.</h3>
        <p>Start a timer session to build your study history.</p>
      </div>
    )
  }

  return (
    <div className="table-wrap">
      <table className="session-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Subject</th>
            <th>Planned Time</th>
            <th>Actual Time</th>
            <th>Completed</th>
            <th>Distractions</th>
            <th>Energy Level</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => (
            <tr key={session.id}>
              <td>{formatSessionDate(session.date)}</td>
              <td>{session.subject}</td>
              <td>{formatMinutes(session.plannedMinutes)}</td>
              <td>{formatMinutes(session.actualMinutes)}</td>
              <td>
                <span
                  className={`status-badge ${
                    session.completed ? 'completed' : 'incomplete'
                  }`}
                >
                  {session.completed ? 'Yes' : 'No'}
                </span>
              </td>
              <td>{session.distractions}</td>
              <td>{session.energyLevel}</td>
              <td>
                <button
                  className="danger-button"
                  type="button"
                  onClick={() => onDeleteSession(session.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default SessionTable
