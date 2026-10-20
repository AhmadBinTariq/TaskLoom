import { useState, useEffect } from 'react'
import { Outlet, useOutletContext, useParams, Link } from 'react-router-dom'
import { api } from '../api/client'
import { can as canDo } from '../app/permissions'
import { LoadingState, EmptyState } from './States'

function WorkspaceLayout() {
  const { workspaceId } = useParams()
  const [workspace, setWorkspace] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let active = true
    setStatus('loading')
    api.workspaces
      .get(workspaceId)
      .then((ws) => {
        if (active) {
          setWorkspace(ws)
          setStatus('ready')
        }
      })
      .catch(() => {
        if (active) setStatus('error')
      })
    return () => {
      active = false
    }
  }, [workspaceId])

  if (status === 'loading') return <LoadingState label="Loading workspace…" />

  if (status === 'error' || !workspace) {
    return (
      <EmptyState title="You do not have access" action={<Link className="btn btn--primary" to="/">Go home</Link>}>
        This workspace does not exist or you are not a member of it.
      </EmptyState>
    )
  }

  const context = { workspace, can: (action) => canDo(workspace.myRole, action) }
  return <Outlet context={context} />
}

export function useWorkspace() {
  return useOutletContext()
}

export default WorkspaceLayout
