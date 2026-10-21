import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { api } from '../api/client'
import { LoadingState } from '../components/States'

function Home() {
  const [loading, setLoading] = useState(true)
  const [workspaces, setWorkspaces] = useState([])

  useEffect(() => {
    api.workspaces
      .list()
      .then((ws) => setWorkspaces(ws))
      .catch(() => setWorkspaces([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingState />
  if (workspaces.length === 0) return <Navigate to="/workspaces/new" replace />
  return <Navigate to={`/w/${workspaces[0].id}`} replace />
}

export default Home
