import { useEffect } from 'react'
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { api } from './api/client'
import { selectCurrentUser, selectToken, selectAuthLoading, setUser, logout } from './features/auth/authSlice'
import { applyTheme } from './app/theme'
import { LoadingState } from './components/States'
import AppLayout from './components/AppLayout'
import WorkspaceLayout from './components/WorkspaceLayout'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import NewWorkspace from './pages/NewWorkspace'
import Projects from './pages/Projects'
import WorkspaceSettings from './pages/WorkspaceSettings'
import NotFound from './pages/NotFound'

function RequireAuth() {
  const user = useSelector(selectCurrentUser)
  const location = useLocation()
  if (!user) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />
  }
  return <Outlet />
}

function GuestOnly() {
  const user = useSelector(selectCurrentUser)
  const location = useLocation()
  if (user) {
    const next = new URLSearchParams(location.search).get('next')
    return <Navigate to={next && next.startsWith('/') ? next : '/'} replace />
  }
  return <Outlet />
}

function App() {
  const dispatch = useDispatch()
  const token = useSelector(selectToken)
  const user = useSelector(selectCurrentUser)
  const loading = useSelector(selectAuthLoading)

  useEffect(() => {
    if (token && !user) {
      api.auth
        .me()
        .then((u) => {
          dispatch(setUser(u))
          applyTheme(u.theme)
        })
        .catch(() => dispatch(logout()))
    }
  }, [token, user, dispatch])

  if (loading) {
    return <LoadingState label="Starting Taskloom…" />
  }

  return (
    <>
      <Routes>
        <Route element={<GuestOnly />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/workspaces/new" element={<NewWorkspace />} />

            <Route path="/w/:workspaceId" element={<WorkspaceLayout />}>
              <Route index element={<Projects />} />
              <Route path="settings" element={<WorkspaceSettings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
      </Routes>
    </>
  )
}

export default App
