import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export function AuthLoadingScreen() {
  return (
    <div className="auth-shell">
      <section className="panel auth-loading-panel" aria-live="polite">
        <p className="eyebrow">FocusFlow</p>
        <h1>Checking account</h1>
        <p>Preparing your secure workspace.</p>
      </section>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { loading, user } = useAuth()
  const location = useLocation()

  if (loading) {
    return <AuthLoadingScreen />
  }

  if (!user) {
    return <Navigate to="/signin" replace state={{ from: location }} />
  }

  return children
}

export function PublicOnlyRoute({ children }) {
  const { loading, user } = useAuth()

  if (loading) {
    return <AuthLoadingScreen />
  }

  if (user) {
    return <Navigate to="/timer" replace />
  }

  return children
}

export default ProtectedRoute
