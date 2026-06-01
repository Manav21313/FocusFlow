import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthForm, { PasswordField } from '../components/AuthForm'
import { useAuth } from '../context/useAuth'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const strongPasswordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/

function SignUpPage() {
  const navigate = useNavigate()
  const { authError, configError, isConfigured, signInWithGoogle, signUp } =
    useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const validate = () => {
    if (!name.trim()) {
      return 'Enter your name.'
    }

    if (!emailPattern.test(email.trim())) {
      return 'Enter a valid email address.'
    }

    if (!strongPasswordPattern.test(password)) {
      return 'Use at least 8 characters with uppercase, lowercase, number, and special character.'
    }

    if (password !== confirmPassword) {
      return 'Passwords do not match.'
    }

    return ''
  }

  const submitSignUp = async (event) => {
    event.preventDefault()

    if (!isConfigured) {
      setError(configError)
      setSuccess('')
      return
    }

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      setSuccess('')
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const message = await signUp({
        name: name.trim(),
        email: email.trim(),
        password,
      })

      setSuccess(message)
      setPassword('')
      setConfirmPassword('')
    } catch (authError) {
      setError(authError.safeMessage || authError.message)
    } finally {
      setSubmitting(false)
    }
  }

  const submitGoogleSignIn = async () => {
    if (!isConfigured) {
      setError(configError)
      setSuccess('')
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const signedInUser = await signInWithGoogle()

      if (signedInUser) {
        navigate('/timer', { replace: true })
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
          <p className="eyebrow">Create account</p>
          <h1>Start securely</h1>
          <p>New accounts must verify email before the app opens.</p>
        </div>
      </section>

      <section className="auth-grid" aria-label="Create a FocusFlow account">
        <AuthForm
          eyebrow="Sign up"
          title="Create account"
          detail="Use a strong password and a real email address."
          error={error || authError || (!isConfigured ? configError : '')}
          success={success}
          submitLabel="Create account"
          submitting={submitting}
          disabled={!isConfigured}
          onSubmit={submitSignUp}
          onGoogle={isConfigured ? submitGoogleSignIn : null}
          googleLabel="Sign up with Google"
          footer={
            <span>
              Already have an account? <Link to="/signin">Sign in</Link>
            </span>
          }
        >
          <label className="field">
            <span>Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Manav"
              autoComplete="name"
              required
            />
          </label>

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
            placeholder="8+ chars, Aa, 1, special"
            autoComplete="new-password"
            minLength={8}
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword((current) => !current)}
          />

          <PasswordField
            label="Confirm password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Repeat password"
            autoComplete="new-password"
            minLength={8}
            showPassword={showConfirmPassword}
            onTogglePassword={() =>
              setShowConfirmPassword((current) => !current)
            }
          />
        </AuthForm>

        <aside className="panel auth-side">
          <p className="eyebrow">Account rules</p>
          <h2>Verification keeps each FocusFlow workspace private.</h2>
          <div className="auth-feature-list">
            <article>
              <strong>Strong password</strong>
              <span>At least 8 characters with mixed case, number, and symbol.</span>
            </article>
            <article>
              <strong>Verification first</strong>
              <span>Email/password accounts cannot enter protected pages until verified.</span>
            </article>
            <article>
              <strong>Google option</strong>
              <span>Available when Google sign-in is enabled in Firebase.</span>
            </article>
          </div>
        </aside>
      </section>
    </div>
  )
}

export default SignUpPage
