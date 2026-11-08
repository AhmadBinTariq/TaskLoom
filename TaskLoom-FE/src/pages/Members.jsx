import { useState, useEffect, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { api } from '../api/client'
import { selectCurrentUser } from '../features/auth/authSlice'
import { toast } from '../features/ui/uiSlice'
import { assignableRoles, canManageMember, roleLabel } from '../app/permissions'
import { useWorkspace } from '../components/WorkspaceLayout'
import PageHeader from '../components/PageHeader'
import Avatar from '../components/Avatar'
import './members.css'

function Members() {
  const { workspace, can } = useWorkspace()
  const dispatch = useDispatch()
  const me = useSelector(selectCurrentUser)
  const canManage = can('member:manage')
  const roles = assignableRoles(workspace.myRole)

  const [members, setMembers] = useState([])

  const loadMembers = useCallback(() => {
    api.members.list(workspace.id).then(setMembers).catch(() => setMembers([]))
  }, [workspace.id])

  useEffect(() => {
    loadMembers()
  }, [loadMembers])

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

  return (
    <>
      <PageHeader title="Members" subtitle={`${workspace.name} · ${members.length} people`} />

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
    </>
  )
}

export default Members
