import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { selectCurrentUser, logout } from '../features/auth/authSlice'
import Avatar from './Avatar'
import Icon from './Icon'
import './AppLayout.css'

function AppLayout() {
  const user = useSelector(selectCurrentUser)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <nav className="app-sidebar">
        <div className="app-brand-row">
          <span className="app-brand">Taskloom</span>
        </div>

        <div className="app-footer">
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

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
