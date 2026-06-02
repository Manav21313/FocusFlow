import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute, {
  AuthLoadingScreen,
  PublicOnlyRoute,
} from './components/ProtectedRoute'
import { useAuth } from './context/useAuth'
import { defaultSettings } from './data/defaultSettings'
import DashboardPage from './pages/DashboardPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import HistoryPage from './pages/HistoryPage'
import SettingsPage from './pages/SettingsPage'
import SignInPage from './pages/SignInPage'
import SignUpPage from './pages/SignUpPage'
import SpotifyCallbackPage from './pages/SpotifyCallbackPage'
import TimerPage from './pages/TimerPage'
import {
  loadSessions,
  loadSettings,
  loadTodos,
  saveSessions,
  saveSettings,
  saveTodos,
} from './utils/storage'
import './App.css'

const routeByPage = {
  timer: '/timer',
  dashboard: '/dashboard',
  history: '/history',
  settings: '/settings',
  signin: '/signin',
  signup: '/signup',
  forgotPassword: '/forgot-password',
}

const pageByPath = {
  '/timer': 'timer',
  '/dashboard': 'dashboard',
  '/history': 'history',
  '/settings': 'settings',
  '/signin': 'signin',
  '/signup': 'signup',
  '/forgot-password': 'forgotPassword',
  '/callback': 'timer',
}

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout, user } = useAuth()
  const currentPage = pageByPath[location.pathname] || 'timer'
  const isTimerPage = currentPage === 'timer'
  const showNavbar =
    Boolean(user) && ['dashboard', 'history', 'settings'].includes(currentPage)

  useEffect(() => {
    if (!user) {
      document.documentElement.dataset.theme = defaultSettings.theme
    }
  }, [user])

  const navigateToPage = (page) => {
    const route = routeByPage[page]

    if (route) {
      navigate(route)
    }
  }

  const signOutUser = async () => {
    await logout()
    navigate('/signin', { replace: true })
  }

  return (
    <main className={`app-shell ${isTimerPage ? 'timer-shell' : ''}`}>
      {showNavbar ? (
        <Navbar
          currentPage={currentPage}
          currentUser={user}
          onNavigate={navigateToPage}
          onSignOut={signOutUser}
        />
      ) : null}

      <Routes>
        <Route path="/" element={<Navigate to="/timer" replace />} />
        <Route
          path="/signin"
          element={
            <PublicOnlyRoute>
              <SignInPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicOnlyRoute>
              <SignUpPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicOnlyRoute>
              <ForgotPasswordPage />
            </PublicOnlyRoute>
          }
        />
        <Route path="/callback" element={<SpotifyCallbackPage />} />
        <Route
          path="/*"
          element={
            <ProtectedAppRoutes
              currentUser={user}
              onNavigate={navigateToPage}
              onSignOut={signOutUser}
            />
          }
        />
      </Routes>
    </main>
  )
}

function ProtectedAppRoutes({ currentUser, onNavigate, onSignOut }) {
  return (
    <ProtectedRoute>
      <UserDataRoute key={currentUser?.uid}>
        {({
          sessions,
          settings,
          todos,
          addSession,
          deleteSession,
          clearSessions,
          setSettings,
          setTodos,
        }) => (
          <Routes>
            <Route
              path="/timer"
              element={
                <TimerPage
                  userId={currentUser?.uid}
                  settings={settings}
                  todos={todos}
                  onNavigate={onNavigate}
                  onSaveSession={addSession}
                  onSaveTodos={setTodos}
                  onSignOut={onSignOut}
                />
              }
            />
            <Route
              path="/dashboard"
              element={
                <DashboardPage
                  sessions={sessions}
                  settings={settings}
                  todos={todos}
                  onSaveSettings={setSettings}
                />
              }
            />
            <Route
              path="/history"
              element={
                <HistoryPage
                  sessions={sessions}
                  onDeleteSession={deleteSession}
                  onClearSessions={clearSessions}
                />
              }
            />
            <Route
              path="/settings"
              element={
                <SettingsPage
                  currentUser={currentUser}
                  settings={settings}
                  onSaveSettings={setSettings}
                  onSignOut={onSignOut}
                />
              }
            />
            <Route path="*" element={<Navigate to="/timer" replace />} />
          </Routes>
        )}
      </UserDataRoute>
    </ProtectedRoute>
  )
}

function UserDataRoute({ children }) {
  const { user } = useAuth()
  const uid = user?.uid
  const [sessions, setSessions] = useState(() => loadSessions(uid))
  const [settings, setSettings] = useState(() => loadSettings(uid))
  const [todos, setTodos] = useState(() => loadTodos(uid))

  useEffect(() => {
    if (!uid) return

    saveSessions(uid, sessions)
  }, [sessions, uid])

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme

    if (!uid) return

    saveSettings(uid, settings)
  }, [settings, uid])

  useEffect(() => {
    if (!uid) return

    saveTodos(uid, todos)
  }, [todos, uid])

  const addSession = (session) => {
    setSessions((currentSessions) => [session, ...currentSessions])
  }

  const deleteSession = (id) => {
    setSessions((currentSessions) =>
      currentSessions.filter((session) => session.id !== id),
    )
  }

  const clearSessions = () => {
    setSessions([])
  }

  if (!uid) {
    return <AuthLoadingScreen />
  }

  return children({
    sessions,
    settings,
    todos,
    addSession,
    deleteSession,
    clearSessions,
    setSettings,
    setTodos,
  })
}

export default App
