import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthForm, { PasswordField } from '../components/AuthForm'
import { useAuth } from '../context/useAuth'

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

function AuthSidePanel() {
  return (
    <aside className="panel auth-side">
      <p className="eyebrow">Secure workspace</p>
      <h2>Focus, tasks, and progress stay tied to your verified account.</h2>
      <div className="auth-feature-list">
        <article>
          <strong>Email verification</strong>
          <span>Protected pages open only after Firebase verifies your email.</span>
        </article>
        <article>
          <strong>Private local data</strong>
          <span>Sessions, settings, and tasks are stored under your user id.</span>
        </article>
        <article>
          <strong>No password storage</strong>
          <span>FocusFlow never saves raw passwords or secrets in localStorage.</span>
        </article>
      </div>
    </aside>
  )
}

function SignInPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { authError, configError, isConfigured, signIn, signInWithGoogle } =
    useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const redirectTo = location.state?.from?.pathname || '/timer'

  const validate = () => {
    const trimmedEmail = email.trim()

    if (!isValidEmail(trimmedEmail)) {
      return 'Enter a valid email address.'
    }

    if (!password) {
      return 'Enter your password.'
    }

    return ''
  }

  const submitSignIn = async (event) => {
    event.preventDefault()

    if (!isConfigured) {
      setError(configError)
      return
    }

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)
    setError('')

    try {
      await signIn({ email: email.trim(), password })
      navigate(redirectTo, { replace: true })
    } catch (authError) {
      setError(authError.safeMessage || authError.message)
    } finally {
      setSubmitting(false)
    }
  }

  const submitGoogleSignIn = async () => {
    if (!isConfigured) {
      setError(configError)
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const signedInUser = await signInWithGoogle()

      if (signedInUser) {
        navigate(redirectTo, { replace: true })
      }
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
          <p className="eyebrow">Sign in</p>
          <h1>FocusFlow account</h1>
          <p>Use your verified Firebase account to open your workspace.</p>
        </div>
      </section>

      <section className="auth-grid" aria-label="Sign in to FocusFlow">
        <AuthForm
          eyebrow="Welcome back"
          title="Sign in"
          detail="Enter your email and password."
          error={error || authError || (!isConfigured ? configError : '')}
          submitLabel="Sign in"
          submitting={submitting}
          disabled={!isConfigured}
          onSubmit={submitSignIn}
          onGoogle={isConfigured ? submitGoogleSignIn : null}
          footer={
            <>
              <Link to="/forgot-password">Forgot password?</Link>
              <span>
                New to FocusFlow? <Link to="/signup">Create account</Link>
              </span>
            </>
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

          <PasswordField
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Your password"
            autoComplete="current-password"
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword((current) => !current)}
          />
        </AuthForm>

        <AuthSidePanel />
      </section>
    </div>
  )
}

export default SignInPage
