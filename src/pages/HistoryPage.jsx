import { useMemo, useState } from 'react'
import SessionTable from '../components/SessionTable'

function HistoryPage({ sessions, onDeleteSession, onClearSessions }) {
  const [subjectFilter, setSubjectFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [sortOrder, setSortOrder] = useState('newest')

  const subjects = useMemo(
    () =>
      Array.from(new Set(sessions.map((session) => session.subject))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [sessions],
  )

  const filteredSessions = useMemo(() => {
    return sessions
      .filter((session) =>
        subjectFilter === 'All' ? true : session.subject === subjectFilter,
      )
      .filter((session) => {
        if (statusFilter === 'All') return true
        if (statusFilter === 'completed') return session.completed
        return !session.completed
      })
      .sort((a, b) => {
        const aTime = new Date(a.startTime).getTime()
        const bTime = new Date(b.startTime).getTime()

        return sortOrder === 'newest' ? bTime - aTime : aTime - bTime
      })
  }, [sessions, sortOrder, statusFilter, subjectFilter])

  const clearAll = () => {
    const confirmed = window.confirm(
      'Clear all FocusFlow history? This removes every saved session from this browser.',
    )

    if (confirmed) {
      onClearSessions()
    }
  }

  return (
    <div className="history-page">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">History</p>
          <h1>Study sessions</h1>
          <p>Review saved sessions by date, subject, completion, distractions, and energy.</p>
        </div>
        <button
          className="danger-button"
          type="button"
          onClick={clearAll}
          disabled={sessions.length === 0}
        >
          Clear all history
        </button>
      </section>

      <section className="panel filter-panel" aria-label="History filters">
        <label className="field">
          <span>Filter by subject</span>
          <select
            value={subjectFilter}
            onChange={(event) => setSubjectFilter(event.target.value)}
          >
            <option value="All">All subjects</option>
            {subjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Filter by completed/incomplete</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="All">All sessions</option>
            <option value="completed">Completed</option>
            <option value="incomplete">Incomplete</option>
          </select>
        </label>

        <label className="field">
          <span>Sort</span>
          <select
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </label>
      </section>

      <SessionTable sessions={filteredSessions} onDeleteSession={onDeleteSession} />
    </div>
  )
}

export default HistoryPage
