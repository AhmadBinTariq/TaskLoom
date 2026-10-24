import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { api } from '../api/client'
import { toast } from '../features/ui/uiSlice'
import { useWorkspace } from '../components/WorkspaceLayout'
import PageHeader from '../components/PageHeader'
import './workspaces.css'

function WorkspaceSettings() {
  const { workspace, can } = useWorkspace()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [name, setName] = useState(workspace.name)

  const isOwner = workspace.myRole === 'owner'

  async function saveName(event) {
    event.preventDefault()
    if (name.trim().length < 2) return
    try {
      await api.workspaces.rename(workspace.id, name.trim())
      dispatch(toast('Workspace renamed.', 'success'))
    } catch (err) {
      dispatch(toast(err.message, 'error'))
    }
  }

  async function leaveOrDelete() {
    const message = isOwner ? `Delete "${workspace.name}" permanently?` : `Leave "${workspace.name}"?`
    if (!confirm(message)) return
    try {
      if (isOwner) {
        await api.workspaces.remove(workspace.id)
        dispatch(toast('Workspace deleted.', 'success'))
      } else {
        await api.workspaces.leave(workspace.id)
        dispatch(toast('You left the workspace.', 'success'))
      }
      navigate('/', { replace: true })
    } catch (err) {
      dispatch(toast(err.message, 'error'))
    }
  }

  return (
    <>
      <PageHeader title="Workspace settings" subtitle={workspace.name} />

      <section className="card ws-panel">
        <h2>Name</h2>
        {can('workspace:rename') ? (
          <form className="ws-inline-form" onSubmit={saveName}>
            <div className="field">
              <label htmlFor="ws-rename">Workspace name</label>
              <input id="ws-rename" className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <button className="btn btn--primary" type="submit" disabled={name.trim() === workspace.name}>Save</button>
          </form>
        ) : (
          <p className="muted">Only Owners and Admins can rename the workspace.</p>
        )}
      </section>

      <section className="card ws-panel ws-danger">
        <h2>{isOwner ? 'Delete workspace' : 'Leave workspace'}</h2>
        <p className="muted">
          {isOwner
            ? 'Deletes every project, task, comment and invitation in this workspace. Members lose access immediately.'
            : 'You will lose access to this workspace until someone invites you again.'}
        </p>
        <div>
          <button className="btn btn--danger" onClick={leaveOrDelete}>{isOwner ? 'Delete workspace' : 'Leave workspace'}</button>
        </div>
      </section>
    </>
  )
}

export default WorkspaceSettings
