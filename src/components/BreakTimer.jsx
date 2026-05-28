import { useEffect, useState } from 'react'

const formatSeconds = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60

  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function BreakTimer({ minutes, onDismiss }) {
  const initialSeconds = Math.max(1, Number(minutes) || 5) * 60
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds)
  const [isRunning, setIsRunning] = useState(true)

  useEffect(() => {
    if (!isRunning) return undefined

    const timer = window.setInterval(() => {
      setSecondsLeft((currentSeconds) => {
        if (currentSeconds <= 1) {
          setIsRunning(false)
          return 0
        }

        return currentSeconds - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [isRunning])

  return (
    <section className="break-card" aria-label="Break timer">
      <div>
        <p className="eyebrow">Break</p>
        <h2>{formatSeconds(secondsLeft)}</h2>
        <p>Recharge before your next focus session.</p>
      </div>
      <div className="break-actions">
        <button
          className="secondary-button"
          type="button"
          onClick={() => setIsRunning((running) => !running)}
          disabled={secondsLeft === 0}
        >
          {isRunning ? 'Pause' : 'Resume'}
        </button>
        <button className="primary-button" type="button" onClick={onDismiss}>
          Done
        </button>
      </div>
    </section>
  )
}

export default BreakTimer
