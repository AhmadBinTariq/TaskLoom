import { useState, useEffect, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { api } from '../api/client'
import { selectCurrentUser } from '../features/auth/authSlice'
import { toast } from '../features/ui/uiSlice'
import { assignableRoles, canManageMember, roleLabel } from '../app/permissions'
import { useWorkspace } from '../components/WorkspaceLayout'
import PageHeader from '../components/PageHeader'
import Avatar from '../components/Avatar'
import Icon from '../components/Icon'
import './members.css'

const roleHelp = {
  owner: 'Full control, including deleting the workspace.',
  admin: 'Manages projects, columns, labels, Members and Viewers.',
  member: 'Creates, edits and moves tasks; comments.',
  viewer: 'Read-only access.',
}

function timeLeft(iso) {
  const ms = new Date(iso).getTime() - Date.now()
  if (ms <= 0) return 'expired'
  const hours = Math.floor(ms / 3600000)
  return hours >= 1 ? `expires in ${hours}h` : `expires in ${Math.max(1, Math.round(ms / 60000))}m`
}

function Members() {
  const { workspace, can } = useWorkspace()
  const dispatch = useDispatch()
  const me = useSelector(selectCurrentUser)
  const canManage = can('member:manage')
  const roles = assignableRoles(workspace.myRole)

  const [members, setMembers] = useState([])
  const [invitations, setInvitations] = useState([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')
  const [error, setError] = useState('')

  const loadMembers = useCallback(() => {
    api.members.list(workspace.id).then(setMembers).catch(() => setMembers([]))
  }, [workspace.id])

  const loadInvites = useCallback(() => {
    if (canManage) api.invitations.list(workspace.id).then(setInvitations).catch(() => setInvitations([]))
  }, [workspace.id, canManage])

  useEffect(() => {
    loadMembers()
    loadInvites()
  }, [loadMembers, loadInvites])

  async function sendInvite(event) {
    event.preventDefault()
    const clean = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setError('Enter a valid email address.')
      return
    }
    if (members.some((m) => m.user.email.toLowerCase() === clean)) {
      setError('This person is already a member.')
      return
    }
    setError('')
    try {
      await api.invitations.create(workspace.id, { email: clean, role })
      dispatch(toast(`Invitation created for ${clean}. It expires in 48 hours.`, 'success'))
      setEmail('')
      loadInvites()
    } catch (err) {
      setError(err.message)
    }
  }

  async function changeRole(userId, newRole) {
    try {
      await api.members.updateRole(workspace.id, userId, newRole)
      loadMembers()
    } catch (err) {
      dispatch(toast(err.message, 'error'))
    }
  }

  async function kick(member) {
    if (!confirm(`Remove ${member.user.name} from ${workspace.name}? They will lose access immediately.`)) return
    try {
      await api.members.remove(workspace.id, member.user.id)
      dispatch(toast('Member removed.', 'success'))
      loadMembers()
    } catch (err) {
      dispatch(toast(err.message, 'error'))
    }
  }

  async function revoke(invId) {
    try {
      await api.invitations.revoke(workspace.id, invId)
      loadInvites()
    } catch (err) {
      dispatch(toast(err.message, 'error'))
    }
  }

  return (
    <>
      <PageHeader title="Members" subtitle={`${workspace.name} · ${members.length} people`} />

      {canManage && (
        <section className="card member-panel">
          <h2>Invite by email</h2>
          <form className="member-invite-form" onSubmit={sendInvite}>
            <div className="field">
              <label htmlFor="invite-email">Email</label>
              <input id="invite-email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@example.com" />
            </div>
            <div className="field">
              <label htmlFor="invite-role">Role</label>
              <select id="invite-role" className="input" value={role} onChange={(e) => setRole(e.target.value)}>
                {roles.map((r) => <option key={r} value={r}>{roleLabel[r]}</option>)}
              </select>
            </div>
            <button className="btn btn--primary" type="submit"><Icon name="mail" size={16} /> Send invitation</button>
          </form>
          <p className="muted">{roleHelp[role]} Invitation links expire after 48 hours.</p>
          {error && <p className="field-error">{error}</p>}
        </section>
      )}

      <section className="card member-panel">
        <h2>People</h2>
        <ul className="member-list">
          {members.map((m) => {
            const manageable = m.user.id !== me.id && canManageMember(workspace.myRole, m.role)
            return (
              <li key={m.user.id} className="member-row">
                <Avatar name={m.user.name} size={34} />
                <div className="member-who">
                  <strong>{m.user.name} {m.user.id === me.id && <span className="muted">(you)</span>}</strong>
                  <span className="muted">{m.user.email}</span>
                </div>
                {manageable ? (
                  <>
                    <label className="visually-hidden" htmlFor={`role-${m.user.id}`}>Role for {m.user.name}</label>
                    <select id={`role-${m.user.id}`} className="input member-role-select" value={m.role} onChange={(e) => changeRole(m.user.id, e.target.value)}>
                      {[m.role, ...roles.filter((r) => r !== m.role)].map((r) => <option key={r} value={r}>{roleLabel[r]}</option>)}
                    </select>
                    <button className="btn btn--danger btn--sm" onClick={() => kick(m)}>Remove</button>
                  </>
                ) : (
                  <span className="badge">{roleLabel[m.role]}</span>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      {canManage && (
        <section className="card member-panel">
          <h2>Pending invitations</h2>
          {invitations.length === 0 && <p className="muted">No pending invitations.</p>}
          {invitations.length > 0 && (
            <ul className="member-list">
              {invitations.map((inv) => (
                <li key={inv.id} className="member-row">
                  <Icon name="mail" />
                  <div className="member-who">
                    <strong>{inv.email}</strong>
                    <span className="muted">{roleLabel[inv.role]}</span>
                  </div>
                  <span className={`badge ${inv.expired ? 'member-expired' : ''}`}>
                    <Icon name="clock" size={12} /> {inv.expired ? 'Expired' : timeLeft(inv.expiresAt)}
                  </span>
                  <button className="btn btn--ghost btn--sm" onClick={() => revoke(inv.id)}>{inv.expired ? 'Remove' : 'Revoke'}</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  )
}

export default Members
