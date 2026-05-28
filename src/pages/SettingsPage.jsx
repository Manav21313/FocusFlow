import { useState } from 'react'
import { defaultSettings } from '../data/defaultSettings'

function SettingsPage({ settings, onSaveSettings }) {
  const [draft, setDraft] = useState(settings)

  const updateDraft = (key, value) => {
    setDraft((currentDraft) => ({ ...currentDraft, [key]: value }))
  }

  const saveSettings = (event) => {
    event.preventDefault()
    onSaveSettings({
      ...draft,
      defaultFocusMinutes: Math.max(1, Number(draft.defaultFocusMinutes) || 25),
      defaultBreakMinutes: Math.max(1, Number(draft.defaultBreakMinutes) || 5),
      dailyFocusGoalMinutes: Math.max(1, Number(draft.dailyFocusGoalMinutes) || 120),
    })
  }

  return (
    <div className="settings-page">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Settings</p>
          <h1>Focus preferences</h1>
          <p>Set your default timers, daily goal, notification tone, and theme.</p>
        </div>
      </section>

      <form className="panel settings-form" onSubmit={saveSettings}>
        <label className="field">
          <span>Default focus time</span>
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
          <span>Default break time</span>
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
          <span>Daily focus goal</span>
          <input
            min="1"
            type="number"
            value={draft.dailyFocusGoalMinutes}
            onChange={(event) =>
              updateDraft('dailyFocusGoalMinutes', event.target.value)
            }
          />
        </label>

        <label className="field">
          <span>Theme</span>
          <select
            value={draft.theme}
            onChange={(event) => updateDraft('theme', event.target.value)}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>

        <label className="toggle-field">
          <input
            checked={draft.soundEnabled}
            type="checkbox"
            onChange={(event) => updateDraft('soundEnabled', event.target.checked)}
          />
          <span>Sound on session save</span>
        </label>

        <div className="settings-actions">
          <button className="primary-button" type="submit">
            Save Settings
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => setDraft(defaultSettings)}
          >
            Reset Defaults
          </button>
        </div>
      </form>
    </div>
  )
}

export default SettingsPage
