function AuthForm({
  eyebrow,
  title,
  detail,
  children,
  error,
  success,
  submitLabel,
  submitting = false,
  disabled = false,
  onSubmit,
  footer,
  onGoogle,
  googleLabel = 'Continue with Google',
}) {
  const actionsDisabled = submitting || disabled

  return (
    <form className="panel auth-card" onSubmit={onSubmit}>
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {detail ? <p>{detail}</p> : null}
      </div>

      {children}

      {error ? (
        <p className="auth-message auth-error" role="alert">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="auth-message auth-success" role="status">
          {success}
        </p>
      ) : null}

      <button className="primary-button" type="submit" disabled={actionsDisabled}>
        {submitting ? 'Working...' : submitLabel}
      </button>

      {onGoogle ? (
        <button
          className="secondary-button google-button"
          type="button"
          onClick={onGoogle}
          disabled={actionsDisabled}
        >
          {googleLabel}
        </button>
      ) : null}

      {footer ? <div className="auth-footer">{footer}</div> : null}
    </form>
  )
}

export function PasswordField({
  label = 'Password',
  value,
  onChange,
  showPassword,
  onTogglePassword,
  autoComplete,
  placeholder,
  minLength,
  required = true,
}) {
  return (
    <label className="field password-field">
      <span>{label}</span>
      <span className="password-control">
        <input
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          minLength={minLength}
          required={required}
          type={showPassword ? 'text' : 'password'}
        />
        <button
          className="secondary-button password-toggle"
          type="button"
          onClick={onTogglePassword}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? 'Hide' : 'Show'}
        </button>
      </span>
    </label>
  )
}

export default AuthForm
