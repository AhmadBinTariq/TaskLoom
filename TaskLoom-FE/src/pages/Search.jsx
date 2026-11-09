import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { emptyFilters, hasActiveFilters } from '../app/filters'
import { useWorkspace } from '../components/WorkspaceLayout'
import PageHeader from '../components/PageHeader'
import FilterBar from '../components/FilterBar'
import Avatar from '../components/Avatar'
import { PriorityBadge, LabelChip, DueBadge } from '../components/TaskCard'
import { LoadingState, EmptyState } from '../components/States'
import '../components/board.css'
import './search.css'

function Search() {
  const { workspace } = useWorkspace()
  const [filters, setFilters] = useState(emptyFilters)
  const [debounced, setDebounced] = useState(emptyFilters)
  const [members, setMembers] = useState([])
  const [labels, setLabels] = useState([])
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.members.list(workspace.id).then(setMembers).catch(() => setMembers([]))
    api.labels.list(workspace.id).then(setLabels).catch(() => setLabels([]))
  }, [workspace.id])

  useEffect(() => {
    const id = setTimeout(() => setDebounced(filters), 250)
    return () => clearTimeout(id)
  }, [filters])

  useEffect(() => {
    if (!hasActiveFilters(debounced)) {
      setResults([])
      return
    }
    setLoading(true)
    api.workspaces
      .search(workspace.id, debounced)
      .then(setResults)
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }, [debounced, workspace.id])

  const active = hasActiveFilters(debounced)

  return (
    <>
      <PageHeader title="Search" subtitle={`Find tasks across every project in ${workspace.name}.`} />
      <FilterBar value={filters} onChange={setFilters} members={members} labels={labels} />

      {!active && <EmptyState title="Search your workspace">Type a word or choose a filter. Filters combine, e.g. high priority + overdue + assigned to you.</EmptyState>}
      {active && loading && <LoadingState label="Searching…" />}
      {active && !loading && results.length === 0 && <EmptyState title="No matching tasks">Try removing a filter.</EmptyState>}

      {active && !loading && results.length > 0 && (
        <>
          <p className="muted" role="status">{results.length === 50 ? 'Showing the first 50 results.' : `${results.length} result${results.length === 1 ? '' : 's'}`}</p>
          <ul className="search-results">
            {results.map(({ task, projectName, columnName }) => {
              const assignee = members.find((m) => m.user.id === task.assigneeId)?.user
              const taskLabels = task.labelIds.map((id) => labels.find((l) => l.id === id)).filter(Boolean)
              return (
                <li key={task.id} className="card search-result">
                  <Link to={`/w/${workspace.id}/p/${task.projectId}/t/${task.id}`} className="search-title">{task.title}</Link>
                  <p className="muted">{projectName} · {columnName}</p>
                  <div className="search-meta">
                    <PriorityBadge priority={task.priority} />
                    {task.dueDate && <DueBadge date={task.dueDate} />}
                    {taskLabels.map((l) => <LabelChip key={l.id} label={l} />)}
                    <span style={{ flex: 1 }} />
                    {assignee ? <span className="search-assignee"><Avatar name={assignee.name} size={22} /> {assignee.name}</span> : <span className="muted">Unassigned</span>}
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </>
  )
}

export default Search
