import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import './workspaces.css'

function NewWorkspace() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (name.trim().length < 2) {
      setError('Workspace name must be at least 2 characters.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const ws = await api.workspaces.create(name.trim())
      navigate(`/w/${ws.id}`)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="ws-centered">
      <div className="card ws-panel">
        <h1>Create a workspace</h1>
        <p className="muted">
          A workspace is your team’s private space. Its projects and tasks are never visible to other
          workspaces. You can also join a workspace through an email invitation.
        </p>
        <form className="ws-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="ws-name">Workspace name</label>
            <input id="ws-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Web Programming Group" autoFocus />
            {error && <span className="field-error">{error}</span>}
          </div>
          <button className="btn btn--primary" type="submit" disabled={loading}>
            {loading ? 'Creating…' : 'Create workspace'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default NewWorkspace
