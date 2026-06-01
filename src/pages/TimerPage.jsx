import { useEffect, useMemo, useState } from 'react'
import BreakTimer from '../components/BreakTimer'
import { toDateKey } from '../utils/dateHelpers'
import {
  getTodoSummary,
  sortTodos,
  todoDifficultyOptions,
} from '../utils/todos'

const presetMinutes = [25, 45, 60]
const energyLevels = ['Low', 'Medium', 'Good', 'High']
const timerNavItems = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'history', label: 'History' },
  { id: 'settings', label: 'Settings' },
]

const formatSeconds = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60

  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

const formatTimePart = (value) => String(value).padStart(2, '0')

const createSessionId = () =>
  `session-${Date.now()}-${Math.random().toString(16).slice(2)}`

const createTodoId = () =>
  `todo-${Date.now()}-${Math.random().toString(16).slice(2)}`

const playSessionTone = () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext
  if (!AudioContext) return

  const audioContext = new AudioContext()
  const oscillator = audioContext.createOscillator()
  const gain = audioContext.createGain()

  oscillator.type = 'sine'
  oscillator.frequency.value = 720
  gain.gain.setValueAtTime(0.08, audioContext.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.28)
  oscillator.connect(gain)
  gain.connect(audioContext.destination)
  oscillator.start()
  oscillator.stop(audioContext.currentTime + 0.3)
}

function TimerPage({
  settings,
  todos,
  onNavigate,
  onSaveSession,
  onSaveTodos,
  onSignOut,
}) {
  const [selectedMinutes, setSelectedMinutes] = useState(settings.defaultFocusMinutes)
  const [customMinutes, setCustomMinutes] = useState(settings.defaultFocusMinutes)
  const [subject, setSubject] = useState('Computer Science')
  const [task, setTask] = useState('')
  const [timeLeft, setTimeLeft] = useState(settings.defaultFocusMinutes * 60)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [distractions, setDistractions] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [startedAt, setStartedAt] = useState(null)
  const [pendingSession, setPendingSession] = useState(null)
  const [showBreak, setShowBreak] = useState(false)
  const [todoSubjectDraft, setTodoSubjectDraft] = useState('')
  const [todoDifficultyDraft, setTodoDifficultyDraft] = useState('Medium')
  const [todoDescriptionDraft, setTodoDescriptionDraft] = useState('')

  const plannedMinutes = useMemo(() => {
    const value = Number(selectedMinutes === 'custom' ? customMinutes : selectedMinutes)

    return Math.max(1, value || settings.defaultFocusMinutes)
  }, [customMinutes, selectedMinutes, settings.defaultFocusMinutes])

  const totalSeconds = plannedMinutes * 60
  const progress = totalSeconds === 0 ? 0 : ((totalSeconds - timeLeft) / totalSeconds) * 100
  const countdownParts = useMemo(() => {
    const hours = Math.floor(timeLeft / 3600)
    const minutes = Math.floor((timeLeft % 3600) / 60)
    const seconds = timeLeft % 60

    return [
      { label: 'Hours', value: String(hours) },
      { label: 'Minutes', value: formatTimePart(minutes) },
      { label: 'Seconds', value: formatTimePart(seconds) },
    ]
  }, [timeLeft])
  const sortedTodos = useMemo(() => sortTodos(todos), [todos])

  useEffect(() => {
    if (!isRunning) return undefined

    const timer = window.setInterval(() => {
      setElapsedSeconds((seconds) => seconds + 1)
      setTimeLeft((seconds) => {
        if (seconds <= 1) {
          setIsRunning(false)
          return 0
        }

        return seconds - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [isRunning])

  const resetTimer = (nextMinutes = plannedMinutes) => {
    setIsRunning(false)
    setHasStarted(false)
    setStartedAt(null)
    setElapsedSeconds(0)
    setDistractions(0)
    setTimeLeft(nextMinutes * 60)
  }

  const changePlannedMinutes = (value) => {
    setSelectedMinutes(value)

    if (!hasStarted && value !== 'custom') {
      setTimeLeft(Number(value) * 60)
    }
  }

  const changeCustomMinutes = (value) => {
    setCustomMinutes(value)

    if (!hasStarted && selectedMinutes === 'custom') {
      setTimeLeft(Math.max(1, Number(value) || 1) * 60)
    }
  }

  const startTimer = () => {
    if (!hasStarted) {
      setStartedAt(new Date().toISOString())
      setHasStarted(true)
      setShowBreak(false)
    }

    setIsRunning(true)
  }

  const pauseTimer = () => {
    setIsRunning(false)
  }

  const buildSession = (completed) => {
    const endTime = new Date()
    const actualMinutes =
      elapsedSeconds === 0 ? 0 : Math.max(1, Math.ceil(elapsedSeconds / 60))

    return {
      id: createSessionId(),
      subject: subject.trim() || 'General Study',
      task: task.trim() || 'Untitled study task',
      plannedMinutes,
      actualMinutes,
      distractions,
      startTime: startedAt || endTime.toISOString(),
      endTime: endTime.toISOString(),
      completed,
      date: toDateKey(endTime),
      energyLevel: 'Medium',
    }
  }

  const requestEnergyBeforeSave = (completed) => {
    if (!hasStarted) return

    setIsRunning(false)
    setPendingSession(buildSession(completed))
  }

  const savePendingSession = (energyLevel) => {
    if (!pendingSession) return

    const session = { ...pendingSession, energyLevel }
    onSaveSession(session)

    if (settings.soundEnabled) {
      playSessionTone()
    }

    setPendingSession(null)
    setTask('')
    resetTimer()
    setShowBreak(session.completed)
  }

  const updateTodos = (updater) => {
    onSaveTodos((currentTodos) =>
      sortTodos(typeof updater === 'function' ? updater(currentTodos) : updater),
    )
  }

  const addTodo = (event) => {
    event.preventDefault()

    const description = todoDescriptionDraft.trim()
    if (!description) return

    updateTodos((currentTodos) => [
      ...currentTodos,
      {
        id: createTodoId(),
        difficulty: todoDifficultyDraft,
        subject: todoSubjectDraft.trim() || subject.trim() || 'General Study',
        description,
        completed: false,
      },
    ])
    setTodoDescriptionDraft('')
  }

  const toggleTodo = (id) => {
    updateTodos((currentTodos) =>
      currentTodos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    )
  }

  const deleteTodo = (id) => {
    updateTodos((currentTodos) => currentTodos.filter((todo) => todo.id !== id))
  }

  const clearCompletedTodos = () => {
    updateTodos((currentTodos) => currentTodos.filter((todo) => !todo.completed))
  }

  const completedTodos = sortedTodos.filter((todo) => todo.completed).length

  return (
    <div className="timer-reference-page">
      <header className="timer-topbar">
        <h1 className="countdown-title">FocusFlow</h1>
        <nav className="timer-route-links" aria-label="FocusFlow navigation">
          {timerNavItems.map((item) => (
            <button
              className="secondary-button"
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
            >
              {item.label}
            </button>
          ))}
          <button className="secondary-button" type="button" onClick={onSignOut}>
            Log out
          </button>
        </nav>
      </header>

      <div className="timer-workflow">
        <section className="countdown-reference" aria-label="Focus countdown">
          <dl
            className="countdown-card"
            aria-label={`${formatSeconds(timeLeft)} remaining`}
          >
            {countdownParts.map((part) => (
              <div className="countdown-part" key={part.label}>
                <dt>{part.label}</dt>
                <dd>{part.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="panel timer-control-panel" aria-label="Timer controls">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Focus Timer</p>
              <h2>{formatSeconds(timeLeft)}</h2>
            </div>
            <span className="timer-status">
              {timeLeft === 0 ? 'Finished' : isRunning ? 'Running' : 'Ready'}
            </span>
          </div>

          <div className="reference-progress" aria-hidden="true">
            <span style={{ width: `${progress}%` }} />
          </div>

          <div className="preset-grid" aria-label="Focus length">
            {presetMinutes.map((minutes) => (
              <button
                className={selectedMinutes === minutes ? 'active' : ''}
                key={minutes}
                type="button"
                onClick={() => changePlannedMinutes(minutes)}
                disabled={hasStarted}
              >
                {minutes} min
              </button>
            ))}
            <button
              className={selectedMinutes === 'custom' ? 'active' : ''}
              type="button"
              onClick={() => changePlannedMinutes('custom')}
              disabled={hasStarted}
            >
              Custom
            </button>
          </div>

          {selectedMinutes === 'custom' ? (
            <label className="field compact-field">
              <span>Custom minutes</span>
              <input
                min="1"
                type="number"
                value={customMinutes}
                onChange={(event) => changeCustomMinutes(event.target.value)}
                disabled={hasStarted}
              />
            </label>
          ) : null}

          <div className="timer-actions">
            <button
              className="primary-button"
              type="button"
              onClick={startTimer}
              disabled={isRunning || timeLeft === 0}
            >
              {hasStarted ? 'Resume' : 'Start'}
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={pauseTimer}
              disabled={!isRunning}
            >
              Pause
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => resetTimer()}
              disabled={!hasStarted && elapsedSeconds === 0}
            >
              Reset
            </button>
          </div>
        </section>

        <section className="panel session-panel" aria-label="Session details">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Study Session</p>
              <h2>Subject and task</h2>
            </div>
          </div>

          <div className="study-session-grid">
            <div className="study-session-main">
              <div className="form-grid">
                <label className="field">
                  <span>Subject</span>
                  <input
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    placeholder="Math, Biology, Computer Science"
                  />
                </label>
                <label className="field">
                  <span>Task</span>
                  <input
                    value={task}
                    onChange={(event) => setTask(event.target.value)}
                    placeholder="Read chapter 4"
                  />
                </label>
              </div>

              <div className="session-metrics">
                <article>
                  <span>Planned</span>
                  <strong>{plannedMinutes} min</strong>
                </article>
                <article>
                  <span>Actual</span>
                  <strong>{Math.floor(elapsedSeconds / 60)} min</strong>
                </article>
                <article>
                  <span>Distractions</span>
                  <strong>{distractions}</strong>
                </article>
              </div>

              <div className="focus-actions">
                <button
                  className="warning-button"
                  type="button"
                  onClick={() => setDistractions((count) => count + 1)}
                  disabled={!hasStarted}
                >
                  I got distracted
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => requestEnergyBeforeSave(false)}
                  disabled={!hasStarted}
                >
                  Stop Session
                </button>
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => requestEnergyBeforeSave(true)}
                  disabled={!hasStarted}
                >
                  Complete Session
                </button>
              </div>
            </div>

            <aside className="todo-panel" aria-label="Session to-do list">
              <div className="todo-heading">
                <div>
                  <p className="eyebrow">To-do list</p>
                  <h3>
                    {completedTodos}/{sortedTodos.length} complete
                  </h3>
                </div>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={clearCompletedTodos}
                  disabled={completedTodos === 0}
                >
                  Clear done
                </button>
              </div>

              <form className="todo-form" onSubmit={addTodo}>
                <label className="field">
                  <span>Difficulty</span>
                  <select
                    value={todoDifficultyDraft}
                    onChange={(event) => setTodoDifficultyDraft(event.target.value)}
                  >
                    {todoDifficultyOptions.map((difficulty) => (
                      <option key={difficulty} value={difficulty}>
                        {difficulty}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Subject</span>
                  <input
                    value={todoSubjectDraft}
                    onChange={(event) => setTodoSubjectDraft(event.target.value)}
                    placeholder={subject || 'General Study'}
                  />
                </label>
                <label className="field todo-description-field">
                  <span>Short description</span>
                  <input
                    value={todoDescriptionDraft}
                    onChange={(event) => setTodoDescriptionDraft(event.target.value)}
                    placeholder="Review recursion notes"
                  />
                </label>
                <button className="primary-button" type="submit">
                  Add
                </button>
              </form>

              <div className="todo-list">
                {sortedTodos.length ? (
                  sortedTodos.map((todo) => (
                    <article
                      className={todo.completed ? 'completed' : ''}
                      key={todo.id}
                    >
                      <label className="todo-check">
                        <input
                          checked={todo.completed}
                          type="checkbox"
                          onChange={() => toggleTodo(todo.id)}
                        />
                        <span className="todo-copy">
                          <span className="todo-meta">
                            <span
                              className={`difficulty-pill difficulty-${todo.difficulty.toLowerCase()}`}
                            >
                              {todo.difficulty}
                            </span>
                            <span>{todo.subject}</span>
                          </span>
                          <strong>{todo.description}</strong>
                        </span>
                      </label>
                      <button
                        className="danger-button"
                        type="button"
                        onClick={() => deleteTodo(todo.id)}
                        aria-label={`Delete ${getTodoSummary(todo)}`}
                      >
                        Delete
                      </button>
                    </article>
                  ))
                ) : (
                  <p>No tasks yet.</p>
                )}
              </div>
            </aside>
          </div>

          {pendingSession ? (
            <div className="energy-box" role="dialog" aria-label="Energy level">
              <div>
                <p className="eyebrow">Before saving</p>
                <h3>How was your energy?</h3>
              </div>
              <div className="energy-grid">
                {energyLevels.map((energyLevel) => (
                  <button
                    className="secondary-button"
                    key={energyLevel}
                    type="button"
                    onClick={() => savePendingSession(energyLevel)}
                  >
                    {energyLevel}
                  </button>
                ))}
                <button
                  className="danger-button"
                  type="button"
                  onClick={() => setPendingSession(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          {showBreak ? (
            <BreakTimer
              minutes={settings.defaultBreakMinutes}
              onDismiss={() => setShowBreak(false)}
            />
          ) : null}
        </section>
      </div>
    </div>
  )
}

export default TimerPage
