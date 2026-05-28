import { useEffect, useMemo, useState } from 'react'
import BreakTimer from '../components/BreakTimer'
import { toDateKey } from '../utils/dateHelpers'

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

function TimerPage({ settings, onNavigate, onSaveSession }) {
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

  return (
    <div className="timer-reference-page">
      <section className="countdown-reference" aria-label="Focus countdown">
ç        <h1 className="countdown-title">
          Countdown timer
          <br />
          Variables
        </h1>

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
      </nav>

      <div className="timer-workflow">
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
