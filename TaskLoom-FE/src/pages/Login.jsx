import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { api } from '../api/client'
import { setCredentials } from '../features/auth/authSlice'
import { applyTheme } from '../app/theme'
import './auth.css'

const demoAccounts = [
  { email: 'azib@taskloom.dev', name: 'Azib Naeem', note: 'Owner of Taskloom Team' },
  { email: 'ahmad@taskloom.dev', name: 'Ahmad Bin Tariq', note: 'Admin of Taskloom Team' },
  { email: 'hamza@taskloom.dev', name: 'Hamza Ali', note: 'Member of Taskloom Team' },
  { email: 'sara@taskloom.dev', name: 'Sara Khan', note: 'Viewer of Taskloom Team (read-only)' },
]

function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (email === '') {
      setError('Please enter your email')
      return
    }
    if (password === '') {
      setError('Please enter your password')
      return
    }
    setError('')
    setLoading(true)
    try {
      const result = await api.auth.login({ email, password })
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
        <h1>Sign in</h1>
        <p className="muted">Welcome back. Pick up where your team left off.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          {error && <p className="field-error">{error}</p>}

          <button className="btn btn--primary" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="auth-switch">
          New to Taskloom? <Link to={`/register${keepParams}`} className="auth-link">Create an account</Link>
        </p>

        <details className="auth-demo">
          <summary>Demo accounts</summary>
          <p className="muted">
            All use the password <code>password123</code>. Click a name to fill the form.
          </p>
          <ul>
            {demoAccounts.map((a) => (
              <li key={a.email}>
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => { setEmail(a.email); setPassword('password123') }}>
                  {a.name}
                </button>
                <span className="muted">{a.note}</span>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </main>
  )
}

export default Login
