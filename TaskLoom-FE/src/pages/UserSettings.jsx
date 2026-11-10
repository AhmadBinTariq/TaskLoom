import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { api } from '../api/client'
import { selectCurrentUser, setUser } from '../features/auth/authSlice'
import { toast } from '../features/ui/uiSlice'
import { applyTheme } from '../app/theme'
import PageHeader from '../components/PageHeader'
import './workspaces.css'

function UserSettings() {
  const dispatch = useDispatch()
  const user = useSelector(selectCurrentUser)
  const [name, setName] = useState(user.name)

  async function saveName(event) {
    event.preventDefault()
    if (name.trim().length < 2) return
    try {
      const updated = await api.auth.updateProfile({ name: name.trim() })
      dispatch(setUser(updated))
      dispatch(toast('Profile saved.', 'success'))
    } catch (err) {
      dispatch(toast(err.message, 'error'))
    }
  }

  async function chooseTheme(theme) {
    applyTheme(theme)
    try {
      const updated = await api.auth.updateProfile({ theme })
      dispatch(setUser(updated))
    } catch {
      applyTheme(user.theme)
    }
  }

  return (
    <>
      <PageHeader title="Your settings" subtitle={user.email} />

      <section className="card ws-panel">
        <h2>Profile</h2>
        <form className="ws-inline-form" onSubmit={saveName}>
          <div className="field">
            <label htmlFor="profile-name">Display name</label>
            <input id="profile-name" className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <button className="btn btn--primary" type="submit" disabled={name.trim() === user.name}>Save</button>
        </form>
      </section>

      <section className="card ws-panel">
        <h2>Appearance</h2>
        <p className="muted">Saved to your account, so it follows you to any device.</p>
        <fieldset style={{ border: 'none', display: 'flex', gap: '0.5rem' }}>
          <legend className="visually-hidden">Theme</legend>
          {['light', 'dark'].map((t) => (
            <label key={t} className="btn btn--outline" style={user.theme === t ? { borderColor: 'var(--color-red-text)' } : undefined}>
              <input type="radio" name="theme" value={t} checked={user.theme === t} onChange={() => chooseTheme(t)} />
              {t === 'light' ? 'Light' : 'Dark'}
            </label>
          ))}
        </fieldset>
      </section>
    </>
  )
}

export default UserSettings
