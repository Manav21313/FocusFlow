import { defaultSettings } from '../data/defaultSettings'
import { sortTodos } from './todos'

const currentUserKey = 'focusflow_current_user'
const themeOptions = new Set(['light', 'dark', 'signature'])

const userScopedKey = (prefix, uid) => `${prefix}_${uid}`

const readJson = (key, fallback) => {
  try {
    const value = window.localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

const writeJson = (key, value) => {
  window.localStorage.setItem(key, JSON.stringify(value))
}

export const loadSessions = (uid) =>
  uid ? readJson(userScopedKey('focusflow_sessions', uid), []) : []

export const saveSessions = (uid, sessions) => {
  if (!uid) return

  writeJson(userScopedKey('focusflow_sessions', uid), sessions)
}

export const loadTodos = (uid) =>
  uid ? sortTodos(readJson(userScopedKey('focusflow_todos', uid), [])) : []

export const saveTodos = (uid, todos) => {
  if (!uid) return

  writeJson(userScopedKey('focusflow_todos', uid), sortTodos(todos))
}

export const loadTimerState = (uid) =>
  uid ? readJson(userScopedKey('focusflow_timer_state', uid), null) : null

export const saveTimerState = (uid, timerState) => {
  if (!uid) return

  writeJson(userScopedKey('focusflow_timer_state', uid), timerState)
}

export const saveSafeUser = (user) => {
  if (!user?.uid) return

  writeJson(currentUserKey, {
    uid: user.uid,
    displayName: user.displayName || '',
    email: user.email || '',
  })
}

export const clearSafeUser = () => {
  window.localStorage.removeItem(currentUserKey)
}

export const loadSettings = (uid) => {
  const settings = {
    ...defaultSettings,
    ...(uid ? readJson(userScopedKey('focusflow_settings', uid), {}) : {}),
  }

  return {
    ...settings,
    theme: themeOptions.has(settings.theme) ? settings.theme : defaultSettings.theme,
  }
}

export const saveSettings = (uid, settings) => {
  if (!uid) return

  writeJson(userScopedKey('focusflow_settings', uid), settings)
}
