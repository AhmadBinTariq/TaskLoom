import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { api } from '../api/client'
import { setCredentials } from '../features/auth/authSlice'
import { applyTheme } from '../app/theme'
import './auth.css'

function Register() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const [name, setName] = useState('')
  const [email, setEmail] = useState(params.get('email') ?? '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (name.trim().length < 2) {
      setError('Please enter your name')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setError('')
    setLoading(true)
    try {
      const result = await api.auth.register({ name: name.trim(), email, password })
      dispatch(setCredentials(result))
      applyTheme(result.user.theme)
      const next = params.get('next')
      navigate(next && next.startsWith('/') ? next : '/', { replace: true })
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const keepParams = params.toString() ? `?${params}` : ''

  return (
    <main className="auth-page">
      <div className="card auth-card">
        <p className="auth-brand">Taskloom</p>
        <h1>Create your account</h1>
        <p className="muted">One shared board for your whole team.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="name">Name</label>
            <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="password">Password (at least 8 characters)</label>
            <input id="password" className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          {error && <p className="field-error">{error}</p>}

          <button className="btn btn--primary" type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to={`/login${keepParams}`} className="auth-link">Sign in</Link>
        </p>
      </div>
    </main>
  )
}

export default Register
