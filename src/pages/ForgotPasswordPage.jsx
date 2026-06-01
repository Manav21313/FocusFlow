import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthForm from '../components/AuthForm'
import { useAuth } from '../context/useAuth'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function ForgotPasswordPage() {
  const { authError, configError, isConfigured, resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submitReset = async (event) => {
    event.preventDefault()

    if (!isConfigured) {
      setError(configError)
      setSuccess('')
      return
    }

    const trimmedEmail = email.trim()
    if (!emailPattern.test(trimmedEmail)) {
      setError('Enter a valid email address.')
      setSuccess('')
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const message = await resetPassword(trimmedEmail)
      setSuccess(message)
    } catch (authError) {
      setError(authError.safeMessage || authError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Password reset</p>
          <h1>Recover access</h1>
          <p>Firebase sends the reset link directly to your email.</p>
        </div>
      </section>

      <section className="auth-grid compact-auth-grid" aria-label="Reset password">
        <AuthForm
          eyebrow="Reset"
          title="Forgot password"
          detail="Enter the email for your FocusFlow account."
          error={error || authError || (!isConfigured ? configError : '')}
          success={success}
          submitLabel="Send reset link"
          submitting={submitting}
          disabled={!isConfigured}
          onSubmit={submitReset}
          footer={
            <span>
              Remembered it? <Link to="/signin">Sign in</Link>
            </span>
          }
        >
          <label className="field">
            <span>Email</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              type="email"
              required
            />
          </label>
        </AuthForm>

        <aside className="panel auth-side">
          <p className="eyebrow">Safe reset</p>
          <h2>Reset links are handled by Firebase Authentication.</h2>
          <div className="auth-feature-list">
            <article>
              <strong>Private response</strong>
              <span>The message stays the same even if no matching account exists.</span>
            </article>
            <article>
              <strong>No password handling</strong>
              <span>FocusFlow never receives or stores your new password.</span>
            </article>
          </div>
        </aside>
      </section>
    </div>
  )
}

export default ForgotPasswordPage
