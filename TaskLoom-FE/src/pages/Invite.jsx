import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { api } from '../api/client'
import { selectCurrentUser } from '../features/auth/authSlice'
import { toast } from '../features/ui/uiSlice'
import { roleLabel } from '../app/permissions'
import { LoadingState } from '../components/States'
import './members.css'

function Invite() {
  const { token } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(selectCurrentUser)

  const [inv, setInv] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let active = true
    api.invitations
      .preview(token)
      .then((data) => { if (active) { setInv(data); setStatus('ready') } })
      .catch(() => { if (active) setStatus('error') })
    return () => { active = false }
  }, [token])

  async function accept() {
    try {
      const ws = await api.invitations.accept(token)
      navigate(`/w/${ws.id}`, { replace: true })
    } catch (err) {
      dispatch(toast(err.message, 'error'))
    }
  }

  if (status === 'loading') return <LoadingState label="Checking invitation…" />

  if (status === 'error' || !inv) {
    return (
      <main className="card member-invite">
        <h1>Invitation not found</h1>
        <p className="muted">This invitation link is invalid.</p>
        <Link className="btn btn--outline" to="/">Go home</Link>
      </main>
    )
  }

  const next = encodeURIComponent(`/invite/${token}`)
  const emailMatches = user && user.email.toLowerCase() === inv.email.toLowerCase()

  return (
    <main className="card member-invite">
      <p style={{ color: 'var(--color-red-text)', fontWeight: 800 }}>Taskloom</p>
      <h1>Join {inv.workspaceName}</h1>
      <p className="muted">
        {inv.invitedByName} invited <strong>{inv.email}</strong> to join as <strong>{roleLabel[inv.role]}</strong>.
      </p>

      {inv.status === 'expired' && <p className="alert alert--error">This invitation expired. Ask {inv.invitedByName} to send a new one.</p>}
      {(inv.status === 'revoked' || inv.status === 'accepted') && <p className="alert alert--warning">This invitation is no longer valid.</p>}

      {inv.status === 'pending' && !user && (
        <>
          <p>Sign in or create an account with {inv.email} to accept.</p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link className="btn btn--primary" to={`/login?next=${next}`}>Sign in</Link>
            <Link className="btn btn--outline" to={`/register?next=${next}&email=${encodeURIComponent(inv.email)}`}>Create account</Link>
          </div>
        </>
      )}

      {inv.status === 'pending' && user && !emailMatches && (
        <p className="alert alert--warning">This invitation was sent to {inv.email}. Sign in with that account to accept it.</p>
      )}

      {inv.status === 'pending' && user && emailMatches && (
        <>
          <p className="muted">Signed in as {user.name} ({user.email}).</p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn--primary" onClick={accept}>Accept invitation</button>
            <Link className="btn btn--outline" to="/">Not now</Link>
          </div>
        </>
      )}
    </main>
  )
}

export default Invite
