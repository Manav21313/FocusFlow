import { useEffect, useMemo, useState } from 'react'
import './App.css'

const initialTasks = [
  {
    id: 1,
    title: 'Draft product brief',
    project: 'Launch',
    estimate: 45,
    priority: 'High',
    done: false,
  },
  {
    id: 2,
    title: 'Review analytics notes',
    project: 'Growth',
    estimate: 25,
    priority: 'Medium',
    done: false,
  },
  {
    id: 3,
    title: 'Send design feedback',
    project: 'Studio',
    estimate: 15,
    priority: 'Low',
    done: true,
  },
]

const timerModes = {
  focus: { label: 'Focus', minutes: 25 },
  short: { label: 'Short break', minutes: 5 },
  deep: { label: 'Deep work', minutes: 50 },
}

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function App() {
  const [tasks, setTasks] = useState(initialTasks)
  const [activeTaskId, setActiveTaskId] = useState(initialTasks[0].id)
  const [mode, setMode] = useState('focus')
  const [timeLeft, setTimeLeft] = useState(timerModes.focus.minutes * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [newTask, setNewTask] = useState('')
  const [newEstimate, setNewEstimate] = useState(30)

  const activeTask = tasks.find((task) => task.id === activeTaskId) ?? tasks[0]
  const completedTasks = tasks.filter((task) => task.done).length
  const openTasks = tasks.length - completedTasks
  const focusMinutes = tasks.reduce(
    (total, task) => total + (task.done ? task.estimate : 0),
    0,
  )

  const completionPercent = useMemo(() => {
    if (!tasks.length) return 0
    return Math.round((completedTasks / tasks.length) * 100)
  }, [completedTasks, tasks.length])

  useEffect(() => {
    if (!isRunning) return undefined

    const timer = window.setInterval(() => {
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

  const changeMode = (nextMode) => {
    setMode(nextMode)
    setTimeLeft(timerModes[nextMode].minutes * 60)
    setIsRunning(false)
  }

  const addTask = (event) => {
    event.preventDefault()
    const title = newTask.trim()

    if (!title) return

    const task = {
      id: Date.now(),
      title,
      project: 'Today',
      estimate: Number(newEstimate),
      priority: 'Medium',
      done: false,
    }

    setTasks((currentTasks) => [task, ...currentTasks])
    setActiveTaskId(task.id)
    setNewTask('')
  }

  const toggleTask = (id) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task,
      ),
    )
  }

  return (
    <main className="app-shell">
      <nav className="topbar" aria-label="Primary">
        <div className="brand-mark" aria-hidden="true">
          FF
        </div>
        <div className="topbar-title">
          <p className="eyebrow">FocusFlow</p>
          <h1>Plan the day. Protect the hour.</h1>
        </div>
        <button className="ghost-button" type="button">
          Export day
        </button>
      </nav>

      <section className="workspace" aria-label="Focus workspace">
        <div className="timer-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Now focusing</p>
              <h2>{activeTask?.title ?? 'Choose a task'}</h2>
            </div>
            <span className="status-pill">
              <span aria-hidden="true"></span>
              {timerModes[mode].label}
            </span>
          </div>

          <div
            className="timer-ring"
            style={{
              '--progress': `${(timeLeft / (timerModes[mode].minutes * 60)) * 100}%`,
            }}
            aria-label={`${formatTime(timeLeft)} remaining`}
          >
            <span>{formatTime(timeLeft)}</span>
          </div>

          <div className="mode-switcher" aria-label="Timer mode">
            {Object.entries(timerModes).map(([key, value]) => (
              <button
                className={mode === key ? 'active' : ''}
                key={key}
                type="button"
                onClick={() => changeMode(key)}
              >
                {value.label}
              </button>
            ))}
          </div>

          <div className="timer-actions">
            <button
              className="primary-button"
              type="button"
              onClick={() => setIsRunning((running) => !running)}
            >
              {isRunning ? 'Pause' : 'Start focus'}
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => changeMode(mode)}
            >
              Reset
            </button>
          </div>
        </div>

        <div className="task-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Task queue</p>
              <h2>{openTasks} open priorities</h2>
            </div>
            <span className="status-pill">
              <span aria-hidden="true"></span>
              {completionPercent}% complete
            </span>
          </div>

          <form className="task-form" onSubmit={addTask}>
            <input
              aria-label="New task"
              placeholder="Add a task to focus on"
              value={newTask}
              onChange={(event) => setNewTask(event.target.value)}
            />
            <select
              aria-label="Estimated minutes"
              value={newEstimate}
              onChange={(event) => setNewEstimate(event.target.value)}
            >
              <option value="15">15m</option>
              <option value="30">30m</option>
              <option value="45">45m</option>
              <option value="60">60m</option>
            </select>
            <button type="submit">Add</button>
          </form>

          <div className="task-list">
            {tasks.map((task, index) => (
              <article
                className={`task-card ${task.done ? 'done' : ''} ${
                  activeTaskId === task.id ? 'selected' : ''
                }`}
                key={task.id}
                style={{ '--delay': `${160 + index * 70}ms` }}
              >
                <button
                  className="check-button"
                  type="button"
                  aria-label={`Mark ${task.title} ${
                    task.done ? 'incomplete' : 'complete'
                  }`}
                  onClick={() => toggleTask(task.id)}
                >
                  <span aria-hidden="true"></span>
                </button>
                <button
                  className="task-content"
                  type="button"
                  onClick={() => setActiveTaskId(task.id)}
                >
                  <strong>{task.title}</strong>
                  <span>
                    {task.project} / {task.estimate} min / {task.priority}
                  </span>
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="insights" aria-label="Daily insight cards">
        <article style={{ '--delay': '280ms' }}>
          <span>{focusMinutes}</span>
          <p>minutes completed</p>
        </article>
        <article style={{ '--delay': '340ms' }}>
          <span>{tasks.length}</span>
          <p>planned tasks</p>
        </article>
        <article style={{ '--delay': '400ms' }}>
          <span>2</span>
          <p>blocked slots</p>
        </article>
        <article style={{ '--delay': '460ms' }}>
          <span>86%</span>
          <p>focus score</p>
        </article>
      </section>

      <section className="schedule" aria-label="Schedule">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Today</p>
            <h2>Protected focus blocks</h2>
          </div>
        </div>
        {['09:00 Planning', '10:30 Deep work', '13:00 Calls', '15:30 Wrap-up'].map(
          (item, index) => (
            <div
              className="schedule-row"
              key={item}
              style={{ '--delay': `${520 + index * 60}ms` }}
            >
              <span>{item.slice(0, 5)}</span>
              <strong>{item.slice(6)}</strong>
            </div>
          ),
        )}
      </section>
    </main>
  )
}

export default App
