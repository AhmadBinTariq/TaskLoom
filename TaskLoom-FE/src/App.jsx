import { useEffect } from 'react'
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { api } from './api/client'
import { selectCurrentUser, selectToken, selectAuthLoading, selectSignedOut, setUser, logout } from './features/auth/authSlice'
import { applyTheme } from './app/theme'
import { LoadingState } from './components/States'
import Toaster from './components/Toaster'
import AppLayout from './components/AppLayout'
import WorkspaceLayout from './components/WorkspaceLayout'
import Login from './pages/Login'
import Register from './pages/Register'
import Invite from './pages/Invite'
import Home from './pages/Home'
import NewWorkspace from './pages/NewWorkspace'
import UserSettings from './pages/UserSettings'
import Projects from './pages/Projects'
import Board from './pages/Board'
import TaskDrawer from './pages/TaskDrawer'
import Search from './pages/Search'
import Members from './pages/Members'
import WorkspaceSettings from './pages/WorkspaceSettings'
import NotFound from './pages/NotFound'

function RequireAuth() {
  const user = useSelector(selectCurrentUser)
  const signedOut = useSelector(selectSignedOut)
  const location = useLocation()
  if (!user) {
    // Only remember the page when access was lost (opened a link while signed out,
    // session expired). After a deliberate sign-out, the next sign-in goes home.
    const to = signedOut ? '/login' : `/login?next=${encodeURIComponent(location.pathname)}`
    return <Navigate to={to} replace />
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

        <Route path="/invite/:token" element={<Invite />} />

        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/workspaces/new" element={<NewWorkspace />} />
            <Route path="/settings" element={<UserSettings />} />

            <Route path="/w/:workspaceId" element={<WorkspaceLayout />}>
              <Route index element={<Projects />} />
              <Route path="p/:projectId" element={<Board />}>
                <Route path="t/:taskId" element={<TaskDrawer />} />
              </Route>
              <Route path="search" element={<Search />} />
              <Route path="members" element={<Members />} />
              <Route path="settings" element={<WorkspaceSettings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
      </Routes>

      <Toaster />
    </>
  )
}

export default App
