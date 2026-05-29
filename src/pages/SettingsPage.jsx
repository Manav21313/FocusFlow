import { useState } from 'react'
import { defaultSettings } from '../data/defaultSettings'

const themeOptions = [
  {
    id: 'light',
    label: 'Light mode',
    detail: 'Bright surfaces with teal focus accents.',
    palette: 'conic-gradient(#fbfcfe 0 30%, #d7dee8 30% 58%, #2a8473 58% 78%, #2563eb 78% 100%)',
  },
  {
    id: 'dark',
    label: 'Dark mode',
    detail: 'Deep neutral surfaces with softened accents.',
    palette: 'conic-gradient(#151b24 0 34%, #283445 34% 58%, #4ab8a0 58% 80%, #74a4ff 80% 100%)',
  },
  {
    id: 'signature',
    label: 'Signature mode',
    detail: 'FocusFlow purple with cyan and amber highlights.',
    palette: 'conic-gradient(#0d0a12 0 34%, #c026ff 34% 58%, #22d3ee 58% 80%, #f5b451 80% 100%)',
  },
]

function SettingsPage({ settings, onSaveSettings }) {
  const [draft, setDraft] = useState(settings)

  const updateDraft = (key, value) => {
    setDraft((currentDraft) => ({ ...currentDraft, [key]: value }))
  }

  const selectTheme = (theme) => {
    const nextTheme = themeOptions.some((option) => option.id === theme)
      ? theme
      : defaultSettings.theme

    updateDraft('theme', nextTheme)
    onSaveSettings({ ...settings, theme: nextTheme })
  }

  const saveSettings = (event) => {
    event.preventDefault()
    onSaveSettings({
      ...draft,
      defaultFocusMinutes: Math.max(1, Number(draft.defaultFocusMinutes) || 25),
      defaultBreakMinutes: Math.max(1, Number(draft.defaultBreakMinutes) || 5),
      dailyFocusGoalMinutes: Math.max(1, Number(draft.dailyFocusGoalMinutes) || 120),
      theme: themeOptions.some((option) => option.id === draft.theme)
        ? draft.theme
        : defaultSettings.theme,
    })
  }

  return (
    <div className="settings-page">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Settings</p>
          <h1>Preferences</h1>
          <p>Choose default timing, daily focus target, sound, and appearance.</p>
        </div>
      </section>

      <form className="settings-form" onSubmit={saveSettings}>
        <section className="panel settings-section settings-section-wide">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Timer defaults</p>
              <h2>Session planning</h2>
            </div>
          </div>

          <div className="settings-field-grid">
            <label className="field">
              <span>Focus duration</span>
              <input
                min="1"
                type="number"
                value={draft.defaultFocusMinutes}
                onChange={(event) =>
                  updateDraft('defaultFocusMinutes', event.target.value)
                }
              />
            </label>

            <label className="field">
              <span>Break duration</span>
              <input
                min="1"
                type="number"
                value={draft.defaultBreakMinutes}
                onChange={(event) =>
                  updateDraft('defaultBreakMinutes', event.target.value)
                }
              />
            </label>

            <label className="field">
              <span>Daily goal</span>
              <input
                min="1"
                type="number"
                value={draft.dailyFocusGoalMinutes}
                onChange={(event) =>
                  updateDraft('dailyFocusGoalMinutes', event.target.value)
                }
              />
            </label>
          </div>
        </section>

        <section className="panel settings-section settings-theme-section">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Appearance</p>
              <h2>Theme</h2>
            </div>
          </div>

          <div className="theme-options" role="radiogroup" aria-label="Appearance">
            {themeOptions.map((option) => (
              <label
                className={`theme-option ${
                  draft.theme === option.id ? 'active' : ''
                }`}
                key={option.id}
              >
                <input
                  checked={draft.theme === option.id}
                  name="theme"
                  type="radio"
                  value={option.id}
                  onChange={() => selectTheme(option.id)}
                />
                <span
                  className="theme-palette"
                  style={{ '--palette': option.palette }}
                  aria-hidden="true"
                />
                <span className="theme-copy">
                  <strong>{option.label}</strong>
                  <span>{option.detail}</span>
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className="panel settings-section">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Feedback</p>
              <h2>Session cues</h2>
            </div>
          </div>

          <label className="toggle-field settings-toggle">
            <input
              checked={draft.soundEnabled}
              type="checkbox"
              onChange={(event) => updateDraft('soundEnabled', event.target.checked)}
            />
            <span>Completion sound</span>
          </label>
        </section>

        <div className="settings-actions">
          <button className="primary-button" type="submit">
            Save
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => setDraft(defaultSettings)}
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  )
}

export default SettingsPage
