import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { api } from '../api/client'
import { toast } from '../features/ui/uiSlice'
import { useWorkspace } from '../components/WorkspaceLayout'
import PageHeader from '../components/PageHeader'
import Icon from '../components/Icon'
import './workspaces.css'

const LABEL_COLORS = ['red', 'orange', 'yellow', 'green', 'teal', 'blue', 'violet', 'pink']

function WorkspaceSettings() {
  const { workspace, can } = useWorkspace()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [labels, setLabels] = useState([])
  const [name, setName] = useState(workspace.name)
  const [labelName, setLabelName] = useState('')
  const [labelColor, setLabelColor] = useState('blue')
  const [labelError, setLabelError] = useState('')

  const isOwner = workspace.myRole === 'owner'

  const loadLabels = useCallback(() => {
    api.labels.list(workspace.id).then(setLabels).catch(() => setLabels([]))
  }, [workspace.id])

  useEffect(() => {
    loadLabels()
  }, [loadLabels])

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

  async function addLabel(event) {
    event.preventDefault()
    const clean = labelName.trim()
    if (clean.length < 1) {
      setLabelError('Label name is required.')
      return
    }
    if (labels.some((l) => l.name.toLowerCase() === clean.toLowerCase())) {
      setLabelError('A label with this name already exists.')
      return
    }
    setLabelError('')
    try {
      await api.labels.create(workspace.id, { name: clean, color: labelColor })
      setLabelName('')
      loadLabels()
    } catch (err) {
      setLabelError(err.message)
    }
  }

  async function removeLabel(labelId) {
    try {
      await api.labels.remove(workspace.id, labelId)
      loadLabels()
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

      <section className="card ws-panel">
        <h2>Labels</h2>
        <p className="muted">Labels are shared by every project in this workspace.</p>
        <ul className="ws-label-list">
          {labels.length === 0 && <li className="muted">No labels yet.</li>}
          {labels.map((l) => (
            <li key={l.id} className="badge">
              <span className="dot" style={{ color: `var(--label-${l.color})` }} />
              {l.name}
              {can('project:manage') && (
                <button className="btn btn--ghost btn--sm" aria-label={`Delete label ${l.name}`} onClick={() => removeLabel(l.id)}>
                  <Icon name="close" size={12} />
                </button>
              )}
            </li>
          ))}
        </ul>
        {can('project:manage') && (
          <form className="ws-inline-form" onSubmit={addLabel}>
            <div className="field">
              <label htmlFor="label-name">New label</label>
              <input id="label-name" className="input" value={labelName} onChange={(e) => setLabelName(e.target.value)} maxLength={24} />
            </div>
            <div className="field">
              <span className="field-label">Colour</span>
              <div className="ws-swatches" role="group" aria-label="Label colour">
                {LABEL_COLORS.map((c) => (
                  <button key={c} type="button" className="ws-swatch" style={{ backgroundColor: `var(--label-${c})` }} aria-pressed={labelColor === c} aria-label={c} onClick={() => setLabelColor(c)} />
                ))}
              </div>
            </div>
            <button className="btn btn--outline" type="submit"><Icon name="plus" size={16} /> Add label</button>
          </form>
        )}
        {labelError && <p className="field-error">{labelError}</p>}
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
