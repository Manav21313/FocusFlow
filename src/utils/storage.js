import { defaultSettings } from '../data/defaultSettings'

const sessionsKey = 'focusflow:sessions'
const settingsKey = 'focusflow:settings'

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

export const loadSettings = () => ({
  ...defaultSettings,
  ...readJson(settingsKey, {}),
})

export const saveSettings = (settings) => {
  writeJson(settingsKey, settings)
}
