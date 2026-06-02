import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { consumeSpotifyCallback } from '../utils/spotify'

const getSafeMessage = (error) =>
  error?.safeMessage || error?.message || 'Spotify sign-in failed.'

function SpotifyCallbackPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const finishSpotifySignIn = async () => {
      try {
        await consumeSpotifyCallback()

        if (active) {
          navigate('/timer', { replace: true })
        }
      } catch (callbackError) {
        if (active) {
          setError(getSafeMessage(callbackError))
        }
      }
    }

    finishSpotifySignIn()

    return () => {
      active = false
    }
  }, [navigate])

  return (
    <div className="auth-shell">
      <section className="panel auth-loading-panel" aria-live="polite">
        <p className="eyebrow">Spotify</p>
        <h1>{error ? 'Connection failed' : 'Connecting Spotify'}</h1>
        <p>{error || 'Returning to FocusFlow.'}</p>
        {error ? (
          <button
            className="primary-button"
            type="button"
            onClick={() => navigate('/timer', { replace: true })}
          >
            Back to timer
          </button>
        ) : null}
      </section>
    </div>
  )
}

export default SpotifyCallbackPage
