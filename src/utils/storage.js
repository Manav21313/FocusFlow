import { defaultSettings } from '../data/defaultSettings'
import { sortTodos } from './todos'

const sessionsKey = 'focusflow:sessions'
const settingsKey = 'focusflow:settings'
const todosKey = 'focusflow:todos'
const userKey = 'focusflow:user'
const themeOptions = new Set(['light', 'dark', 'signature'])

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

export const loadSessions = () => readJson(sessionsKey, [])

export const saveSessions = (sessions) => {
  writeJson(sessionsKey, sessions)
}

export const loadTodos = () => sortTodos(readJson(todosKey, []))

export const saveTodos = (todos) => {
  writeJson(todosKey, sortTodos(todos))
}

export const loadUser = () => readJson(userKey, null)

export const saveUser = (user) => {
  writeJson(userKey, user)
}

export const clearUser = () => {
  window.localStorage.removeItem(userKey)
}

export const loadSettings = () => {
  const settings = {
    ...defaultSettings,
    ...readJson(settingsKey, {}),
  }

  return {
    ...settings,
    theme: themeOptions.has(settings.theme) ? settings.theme : defaultSettings.theme,
  }
}

export const saveSettings = (settings) => {
  writeJson(settingsKey, settings)
}
