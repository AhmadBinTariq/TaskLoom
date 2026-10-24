import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { roleLabel } from '../app/permissions'
import { useWorkspace } from '../components/WorkspaceLayout'
import PageHeader from '../components/PageHeader'
import { LoadingState } from '../components/States'
import './workspaces.css'

function Projects() {
  const { workspace } = useWorkspace()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

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
      />

      {loading && <LoadingState label="Loading projects…" />}

      {!loading && projects.length === 0 && <p className="muted">No projects yet.</p>}

      {!loading && projects.length > 0 && (
        <ul className="ws-grid">
          {projects.map((p) => (
            <li key={p.id} className="card ws-project-card">
              <Link to={`/w/${workspace.id}/p/${p.id}`} className="ws-project-link">
                <h2>{p.name}</h2>
                <p className="muted">{p.description || 'No description'}</p>
                <span className="badge">{p.taskCount === 1 ? '1 task' : `${p.taskCount} tasks`}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export default Projects
