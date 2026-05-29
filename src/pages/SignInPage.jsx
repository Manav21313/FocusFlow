import { useState } from 'react'

const getInitials = (name, email) => {
  const source = name || email || 'FocusFlow'
  const parts = source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)

  return parts.map((part) => part[0].toUpperCase()).join('') || 'FF'
}

function SignInPage({ currentUser, onNavigate, onSignIn, onSignOut }) {
  const [name, setName] = useState(currentUser?.name || '')
  const [email, setEmail] = useState(currentUser?.email || '')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')

  const submitSignIn = (event) => {
    event.preventDefault()

    const trimmedEmail = email.trim()
    const trimmedName = name.trim()

    if (!trimmedEmail.includes('@')) {
      setError('Enter a valid email address.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setError('')
    onSignIn(
      {
        email: trimmedEmail,
        name: trimmedName || trimmedEmail.split('@')[0],
        signedInAt: new Date().toISOString(),
      },
      remember,
    )
  }

  if (currentUser) {
    return (
      <div className="auth-page">
        <section className="hero-panel">
          <div>
            <p className="eyebrow">Account</p>
            <h1>Signed in</h1>
            <p>Use FocusFlow with your saved local profile on this browser.</p>
          </div>
        </section>

        <section className="panel auth-panel">
          <div className="auth-profile">
            <span className="auth-avatar">
              {getInitials(currentUser.name, currentUser.email)}
            </span>
            <div>
              <p className="eyebrow">Current profile</p>
              <h2>{currentUser.name}</h2>
              <p>{currentUser.email}</p>
            </div>
          </div>

          <div className="auth-actions">
            <button
              className="primary-button"
              type="button"
              onClick={() => onNavigate('timer')}
            >
              Continue
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => onNavigate('settings')}
            >
              Settings
            </button>
            <button className="danger-button" type="button" onClick={onSignOut}>
              Sign out
            </button>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Sign in</p>
          <h1>FocusFlow account</h1>
          <p>Keep your workspace personal on this browser.</p>
        </div>
      </section>

      <section className="auth-grid" aria-label="Sign in to FocusFlow">
        <form className="panel auth-card" onSubmit={submitSignIn}>
          <div>
            <p className="eyebrow">Welcome back</p>
            <h2>Sign in</h2>
          </div>

          <label className="field">
            <span>Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Manav"
              autoComplete="name"
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
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="6 characters minimum"
              autoComplete="current-password"
              type="password"
            />
          </label>

          <label className="toggle-field auth-remember">
            <input
              checked={remember}
              type="checkbox"
              onChange={(event) => setRemember(event.target.checked)}
            />
            <span>Remember me on this browser</span>
          </label>

          {error ? <p className="auth-error">{error}</p> : null}

          <button className="primary-button" type="submit">
            Sign in
          </button>
        </form>

        <aside className="panel auth-side">
          <p className="eyebrow">Workspace</p>
          <h2>One place for focus, tasks, and progress.</h2>
          <div className="auth-feature-list">
            <article>
              <strong>Timer ready</strong>
              <span>Start sessions with your saved defaults.</span>
            </article>
            <article>
              <strong>Progress saved</strong>
              <span>Keep study sessions and task history in this browser.</span>
            </article>
            <article>
              <strong>Theme synced</strong>
              <span>Your selected mode stays consistent across pages.</span>
            </article>
          </div>
        </aside>
      </section>
    </div>
  )
}

export default SignInPage
