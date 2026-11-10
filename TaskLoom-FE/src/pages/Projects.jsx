import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { api } from '../api/client'
import { toast } from '../features/ui/uiSlice'
import { roleLabel } from '../app/permissions'
import { useWorkspace } from '../components/WorkspaceLayout'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import Icon from '../components/Icon'
import { LoadingState, EmptyState } from '../components/States'
import './workspaces.css'

function Projects() {
  const { workspace, can } = useWorkspace()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const canManage = can('project:manage')

  const load = useCallback(() => {
    setLoading(true)
    api.projects
      .list(workspace.id)
      .then(setProjects)
      .catch(() => setProjects([]))
      .finally(() => setLoading(false))
  }, [workspace.id])

  useEffect(() => {
    load()
  }, [load])

  return (
    <>
      <PageHeader
        title={workspace.name}
        subtitle={`Your role: ${roleLabel[workspace.myRole]}`}
        actions={canManage && <button className="btn btn--primary" onClick={() => setEditing('new')}><Icon name="plus" size={16} /> New project</button>}
      />

      {loading && <LoadingState label="Loading projects…" />}

      {!loading && projects.length === 0 && (
        <EmptyState title="No projects yet" action={canManage && <button className="btn btn--primary" onClick={() => setEditing('new')}>Create the first project</button>}>
          {canManage ? 'Projects hold a Kanban board each. Create one to start adding tasks.' : 'An Owner or Admin needs to create a project first.'}
        </EmptyState>
      )}

      {!loading && projects.length > 0 && (
        <ul className="ws-grid">
          {projects.map((p) => (
            <li key={p.id} className="card ws-project-card">
              <Link to={`/w/${workspace.id}/p/${p.id}`} className="ws-project-link">
                <h2>{p.name}</h2>
                <p className="muted">{p.description || 'No description'}</p>
                <span className="badge">{p.taskCount === 1 ? '1 task' : `${p.taskCount} tasks`}</span>
              </Link>
              {canManage && (
                <button className="btn btn--ghost btn--icon" aria-label={`Edit ${p.name}`} onClick={() => setEditing(p)}>
                  <Icon name="edit" size={16} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <ProjectDialog
          workspaceId={workspace.id}
          project={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onDone={() => { setEditing(null); load() }}
        />
      )}
    </>
  )
}

function ProjectDialog({ workspaceId, project, onClose, onDone }) {
  const dispatch = useDispatch()
  const [name, setName] = useState(project?.name ?? '')
  const [description, setDescription] = useState(project?.description ?? '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    if (name.trim().length < 2) {
      setError('Project name must be at least 2 characters.')
      return
    }
    setError('')
    setBusy(true)
    try {
      if (project) {
        await api.projects.update(project.id, { name: name.trim(), description: description.trim() })
        dispatch(toast('Project updated.', 'success'))
      } else {
        await api.projects.create(workspaceId, { name: name.trim(), description: description.trim() })
        dispatch(toast('Project created.', 'success'))
      }
      onDone()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${project.name}" and all of its tasks? This cannot be undone.`)) return
    setBusy(true)
    try {
      await api.projects.remove(project.id)
      dispatch(toast('Project deleted.', 'success'))
      onDone()
    } catch (err) {
      dispatch(toast(err.message, 'error'))
      setBusy(false)
    }
  }

  return (
    <Modal open title={project ? 'Edit project' : 'New project'} onClose={onClose}>
      <form className="ws-form" onSubmit={submit}>
        <div className="field">
          <label htmlFor="project-name">Name</label>
          <input id="project-name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
        <div className="field">
          <label htmlFor="project-desc">Description</label>
          <textarea id="project-desc" className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        {error && <p className="field-error">{error}</p>}
        <div className="ws-form-actions">
          {project && <button type="button" className="btn btn--danger" onClick={handleDelete} disabled={busy}><Icon name="trash" size={16} /> Delete</button>}
          <button type="button" className="btn btn--outline" onClick={onClose}>Cancel</button>
          <button className="btn btn--primary" type="submit" disabled={busy}>{project ? 'Save' : 'Create project'}</button>
        </div>
      </form>
    </Modal>
  )
}

export default Projects
