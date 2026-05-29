import { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import DashboardPage from './pages/DashboardPage'
import HistoryPage from './pages/HistoryPage'
import SettingsPage from './pages/SettingsPage'
import SignInPage from './pages/SignInPage'
import TimerPage from './pages/TimerPage'
import {
  clearUser,
  loadSessions,
  loadSettings,
  loadTodos,
  loadUser,
  saveSessions,
  saveSettings,
  saveTodos,
  saveUser,
} from './utils/storage'
import './App.css'

const pages = {
  timer: TimerPage,
  dashboard: DashboardPage,
  history: HistoryPage,
  settings: SettingsPage,
  signin: SignInPage,
}

const getPageFromHash = () => {
  const page = window.location.hash.replace('#', '')

  return pages[page] ? page : 'timer'
}

function App() {
  const [currentPage, setCurrentPage] = useState(getPageFromHash)
  const [sessions, setSessions] = useState(loadSessions)
  const [settings, setSettings] = useState(() => {
    const loadedSettings = loadSettings()
    document.documentElement.dataset.theme = loadedSettings.theme

    return loadedSettings
  })
  const [todos, setTodos] = useState(loadTodos)
  const [currentUser, setCurrentUser] = useState(loadUser)
  const ActivePage = pages[currentPage]
  const isTimerPage = currentPage === 'timer'

  useEffect(() => {
    const syncPageFromHash = () => setCurrentPage(getPageFromHash())

    window.addEventListener('hashchange', syncPageFromHash)
    return () => window.removeEventListener('hashchange', syncPageFromHash)
  }, [])

  useEffect(() => {
    saveSessions(sessions)
  }, [sessions])

  useEffect(() => {
    saveSettings(settings)
    document.documentElement.dataset.theme = settings.theme
  }, [settings])

  useEffect(() => {
    saveTodos(todos)
  }, [todos])

  const navigate = (page) => {
    if (!pages[page]) return

    window.location.hash = page
    setCurrentPage(page)
  }

  const signInUser = (user, remember) => {
    setCurrentUser(user)

    if (remember) {
      saveUser(user)
    } else {
      clearUser()
    }

    navigate('timer')
  }

  const signOutUser = () => {
    setCurrentUser(null)
    clearUser()
    navigate('signin')
  }

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

  return (
    <main className={`app-shell ${isTimerPage ? 'timer-shell' : ''}`}>
      {isTimerPage ? null : (
        <Navbar
          currentPage={currentPage}
          currentUser={currentUser}
          onNavigate={navigate}
          onSignOut={signOutUser}
        />
      )}
      <ActivePage
        currentUser={currentUser}
        sessions={sessions}
        settings={settings}
        todos={todos}
        onSignIn={signInUser}
        onSignOut={signOutUser}
        onSaveSession={addSession}
        onSaveTodos={setTodos}
        onDeleteSession={deleteSession}
        onClearSessions={clearSessions}
        onNavigate={navigate}
        onSaveSettings={setSettings}
      />
    </main>
  )
}

export default App
