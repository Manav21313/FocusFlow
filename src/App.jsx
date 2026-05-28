import { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import DashboardPage from './pages/DashboardPage'
import HistoryPage from './pages/HistoryPage'
import SettingsPage from './pages/SettingsPage'
import TimerPage from './pages/TimerPage'
import {
  loadSessions,
  loadSettings,
  saveSessions,
  saveSettings,
} from './utils/storage'
import './App.css'

const pages = {
  timer: TimerPage,
  dashboard: DashboardPage,
  history: HistoryPage,
  settings: SettingsPage,
}

const getPageFromHash = () => {
  const page = window.location.hash.replace('#', '')

  return pages[page] ? page : 'timer'
}

function App() {
  const [currentPage, setCurrentPage] = useState(getPageFromHash)
  const [sessions, setSessions] = useState(loadSessions)
  const [settings, setSettings] = useState(loadSettings)
  const ActivePage = pages[currentPage]

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

  const navigate = (page) => {
    if (!pages[page]) return

    window.location.hash = page
    setCurrentPage(page)
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
    <main className="app-shell">
      <Navbar currentPage={currentPage} onNavigate={navigate} />
      <ActivePage
        sessions={sessions}
        settings={settings}
        onSaveSession={addSession}
        onDeleteSession={deleteSession}
        onClearSessions={clearSessions}
        onSaveSettings={setSettings}
      />
    </main>
  )
}

export default App
