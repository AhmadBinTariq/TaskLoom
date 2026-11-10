import { useState, useEffect } from 'react'
import { NavLink, Outlet, useLocation, useMatch, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { api } from '../api/client'
import { selectCurrentUser, setUser, logout } from '../features/auth/authSlice'
import { applyTheme } from '../app/theme'
import Avatar from './Avatar'
import Icon from './Icon'
import './AppLayout.css'

function AppLayout() {
  const user = useSelector(selectCurrentUser)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  const match = useMatch('/w/:workspaceId/*')
  const workspaceId = match?.params.workspaceId

  const [workspaces, setWorkspaces] = useState([])
  const [projects, setProjects] = useState([])
  const inWorkspace = workspaceId && workspaces.some((w) => w.id === workspaceId)

  const [menuOpenOn, setMenuOpenOn] = useState(null)
  const menuOpen = menuOpenOn === location.pathname
  const setMenuOpen = (open) => setMenuOpenOn(open ? location.pathname : null)

  useEffect(() => {
    applyTheme(user.theme)
  }, [user.theme])

  useEffect(() => {
    api.workspaces.list().then(setWorkspaces).catch(() => setWorkspaces([]))
  }, [location.pathname])

  useEffect(() => {
    if (workspaceId) api.projects.list(workspaceId).then(setProjects).catch(() => setProjects([]))
    else setProjects([])
  }, [workspaceId, location.pathname])

  const nextTheme = user.theme === 'dark' ? 'light' : 'dark'
  const toggleTheme = async () => {
    applyTheme(nextTheme)
    try {
      const updated = await api.auth.updateProfile({ theme: nextTheme })
      dispatch(setUser(updated))
    } catch {
      applyTheme(user.theme)
    }
  }

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const linkClass = ({ isActive }) => (isActive ? 'is-active' : undefined)

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <button className="btn btn--ghost btn--icon" aria-label="Open navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
          <Icon name="menu" />
        </button>
        <span className="app-brand">Taskloom</span>
      </header>

      <nav className={`app-sidebar ${menuOpen ? 'app-sidebar-open' : ''}`} aria-label="Main">
        <div className="app-brand-row">
          <span className="app-brand">Taskloom</span>
        </div>

        <div className="app-section">
          <label htmlFor="ws-switch" className="app-section-label">Workspace</label>
          <select
            id="ws-switch"
            className="input"
            value={workspaceId ?? ''}
            onChange={(e) => navigate(e.target.value === '__new' ? '/workspaces/new' : `/w/${e.target.value}`)}
          >
            {!workspaceId && <option value="">Select a workspace</option>}
            {workspaces.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
            {workspaceId && !inWorkspace && <option value={workspaceId}>Unavailable workspace</option>}
            <option value="__new">+ Create workspace</option>
          </select>
        </div>

        {inWorkspace && (
          <>
            <ul className="app-nav">
              <li>
                <NavLink end to={`/w/${workspaceId}`} className={linkClass}>
                  <Icon name="folder" /> Projects
                </NavLink>
              </li>
              <li>
                <NavLink to={`/w/${workspaceId}/search`} className={linkClass}>
                  <Icon name="search" /> Search
                </NavLink>
              </li>
              <li>
                <NavLink to={`/w/${workspaceId}/members`} className={linkClass}>
                  <Icon name="users" /> Members
                </NavLink>
              </li>
              <li>
                <NavLink to={`/w/${workspaceId}/settings`} className={linkClass}>
                  <Icon name="settings" /> Workspace settings
                </NavLink>
              </li>
            </ul>

            <div className="app-section">
              <span className="app-section-label">Projects</span>
              <ul className="app-projects">
                {projects.map((p) => (
                  <li key={p.id}>
                    <NavLink to={`/w/${workspaceId}/p/${p.id}`} className={linkClass}>
                      <span className="app-project-name">{p.name}</span>
                    </NavLink>
                  </li>
                ))}
                {projects.length === 0 && <li className="muted">No projects yet</li>}
              </ul>
            </div>
          </>
        )}

        <div className="app-footer">
          <button className="btn btn--ghost btn--sm" onClick={toggleTheme} aria-label={`Switch to ${nextTheme} mode`}>
            <Icon name={user.theme === 'dark' ? 'sun' : 'moon'} size={16} /> {user.theme === 'dark' ? 'Light' : 'Dark'} mode
          </button>
          <div className="app-user-row">
            <NavLink to="/settings" className="app-user">
              <Avatar name={user.name} />
              <span>
                <strong>{user.name}</strong>
                <span className="muted">{user.email}</span>
              </span>
            </NavLink>
            <button className="btn btn--ghost btn--icon" aria-label="Sign out" title="Sign out" onClick={handleLogout}>
              <Icon name="logout" size={16} />
            </button>
          </div>
        </div>
      </nav>
      {menuOpen && <div className="app-scrim" onClick={() => setMenuOpen(false)} />}

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
