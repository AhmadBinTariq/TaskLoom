import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { api } from './api/client'
import { selectCurrentUser, selectToken, selectAuthLoading, setUser, logout } from './features/auth/authSlice'
import { applyTheme } from './app/theme'
import { LoadingState } from './components/States'
import Login from './pages/Login'

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
        <Route path="/login" element={<Login />} />
      </Routes>
    </>
  )
}

export default App
