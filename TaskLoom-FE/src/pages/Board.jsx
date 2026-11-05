import { useState, useEffect, useCallback } from 'react'
import { Outlet, useParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { api } from '../api/client'
import { toast } from '../features/ui/uiSlice'
import { emptyFilters, hasActiveFilters, matchesFilters } from '../app/filters'
import { useWorkspace } from '../components/WorkspaceLayout'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import Icon from '../components/Icon'
import FilterBar from '../components/FilterBar'
import TaskFields from '../components/TaskFields'
import ActivityList from '../components/ActivityList'
import { TaskCardContent } from '../components/TaskCard'
import { LoadingState, EmptyState } from '../components/States'
import '../components/board.css'

const blankTask = { title: '', description: '', assigneeId: null, dueDate: null, priority: 'medium', labelIds: [] }

function Board() {
  const workspaceContext = useWorkspace()
  const { workspace, can } = workspaceContext
  const { projectId } = useParams()
  const dispatch = useDispatch()

  const [board, setBoard] = useState(null)
  const [members, setMembers] = useState([])
  const [labels, setLabels] = useState([])
  const [activity, setActivity] = useState([])
  const [status, setStatus] = useState('loading')

  const [filters, setFilters] = useState(emptyFilters)
  const [showActivity, setShowActivity] = useState(false)
  const [createIn, setCreateIn] = useState(null)

  const reloadBoard = useCallback(() => {
    return api.projects
      .board(projectId)
      .then((b) => { setBoard(b); setStatus('ready') })
      .catch(() => setStatus('error'))
  }, [projectId])

  const reloadActivity = useCallback(() => {
    api.activity.list({ projectId }).then(setActivity).catch(() => setActivity([]))
  }, [projectId])

  useEffect(() => {
    setStatus('loading')
    reloadBoard()
    reloadActivity()
    api.members.list(workspace.id).then(setMembers).catch(() => setMembers([]))
    api.labels.list(workspace.id).then(setLabels).catch(() => setLabels([]))
  }, [projectId, workspace.id, reloadBoard, reloadActivity])

  const reload = () => {
    reloadBoard()
    reloadActivity()
  }

  if (status === 'loading') return <LoadingState label="Loading board…" />
  if (status === 'error' || !board) return <EmptyState title="Project not found">It may have been deleted.</EmptyState>

  const { project, columns, tasks } = board
  const canWrite = can('task:write')
  const canManage = can('project:manage')

  const visibleByColumn = {}
  for (const t of tasks) {
    if (!matchesFilters(t, filters)) continue
    if (!visibleByColumn[t.columnId]) visibleByColumn[t.columnId] = []
    visibleByColumn[t.columnId].push(t)
  }
  const visibleCount = Object.values(visibleByColumn).reduce((n, list) => n + list.length, 0)

  async function onDragEnd(result) {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return
    const destVisible = (visibleByColumn[destination.droppableId] ?? []).filter((t) => t.id !== draggableId)
    const afterTaskId = destination.index === 0 ? null : (destVisible[destination.index - 1]?.id ?? null)
    try {
      await api.tasks.move(draggableId, { columnId: destination.droppableId, afterTaskId })
      reload()
    } catch (err) {
      dispatch(toast(err.message, 'error'))
      reloadBoard()
    }
  }

  return (
    <>
      <PageHeader
        title={project.name}
        subtitle={project.description || undefined}
        actions={
          <button className="btn btn--outline" aria-pressed={showActivity} onClick={() => setShowActivity((s) => !s)}>
            <Icon name="activity" size={16} /> Activity
          </button>
        }
      />

      <FilterBar value={filters} onChange={setFilters} members={members} labels={labels} />
      {hasActiveFilters(filters) && <p className="muted" role="status">Showing {visibleCount} of {tasks.length} tasks.</p>}
      {!canWrite && (
        <p className="alert alert--info"><Icon name="alert" size={16} /> You are a Viewer: you can browse the board but not change it.</p>
      )}

      <div className="board-wrap">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="board">
            {columns.map((column) => (
              <BoardColumn
                key={column.id}
                column={column}
                tasks={visibleByColumn[column.id] ?? []}
                totalInColumn={tasks.filter((t) => t.columnId === column.id).length}
                columnCount={columns.length}
                workspaceId={workspace.id}
                labels={labels}
                members={members}
                canWrite={canWrite}
                canManage={canManage}
                onAddTask={() => setCreateIn(column)}
                onChanged={reload}
              />
            ))}
            {canManage && <AddColumn projectId={projectId} columnCount={columns.length} onChanged={reload} />}
          </div>
        </DragDropContext>

        {showActivity && (
          <aside className="card board-activity-panel" aria-label="Project activity">
            <div className="board-activity-header">
              <h2>Activity</h2>
              <button className="btn btn--ghost btn--icon" aria-label="Close activity" onClick={() => setShowActivity(false)}>
                <Icon name="close" size={16} />
              </button>
            </div>
            <ActivityList items={activity} />
          </aside>
        )}
      </div>

      {createIn && (
        <CreateTaskModal column={createIn} projectId={projectId} members={members} labels={labels} onClose={() => setCreateIn(null)} onDone={() => { setCreateIn(null); reload() }} />
      )}

      <Outlet context={{ ...workspaceContext, reloadBoard: reload }} />
    </>
  )
}

function BoardColumn({ column, tasks, totalInColumn, columnCount, workspaceId, labels, members, canWrite, canManage, onAddTask, onChanged }) {
  const dispatch = useDispatch()
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(column.name)

  async function saveRename(e) {
    e.preventDefault()
    if (!name.trim()) return
    try {
      await api.columns.rename(column.id, name.trim())
      setRenaming(false)
      onChanged()
    } catch (err) {
      dispatch(toast(err.message, 'error'))
    }
  }

  async function handleDelete() {
    if (totalInColumn > 0) {
      dispatch(toast('Move or delete the tasks in this column first.', 'warning'))
      return
    }
    if (columnCount <= 1) {
      dispatch(toast('A board needs at least one column.', 'warning'))
      return
    }
    if (!confirm(`Delete the "${column.name}" column?`)) return
    try {
      await api.columns.remove(column.id)
      onChanged()
    } catch (err) {
      dispatch(toast(err.message, 'error'))
    }
  }

  return (
    <section className="board-column">
      <header className="board-column-header">
        {renaming ? (
          <form className="board-rename-form" onSubmit={saveRename}>
            <input
              id={`rename-${column.id}`}
              className="input"
              value={name}
              maxLength={30}
              autoFocus
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') { setRenaming(false); setName(column.name) } }}
            />
            <button className="btn btn--primary btn--sm" type="submit">Save</button>
          </form>
        ) : (
          <>
            <h2 className="board-column-title">{column.name}</h2>
            <span className="board-count">{tasks.length === totalInColumn ? totalInColumn : `${tasks.length}/${totalInColumn}`}</span>
            {canManage && (
              <span className="board-column-actions">
                <button className="btn btn--ghost btn--icon" aria-label={`Rename ${column.name}`} onClick={() => { setName(column.name); setRenaming(true) }}>
                  <Icon name="edit" size={14} />
                </button>
                <button className="btn btn--ghost btn--icon" aria-label={`Delete ${column.name}`} onClick={handleDelete}>
                  <Icon name="trash" size={14} />
                </button>
              </span>
            )}
          </>
        )}
      </header>

      <Droppable droppableId={column.id} isDropDisabled={!canWrite}>
        {(provided, snapshot) => (
          <ol ref={provided.innerRef} {...provided.droppableProps} className={`board-cards ${snapshot.isDraggingOver ? 'board-drop-target' : ''}`}>
            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index} isDragDisabled={!canWrite}>
                {(drag, dragSnapshot) => (
                  <li ref={drag.innerRef} {...drag.draggableProps} {...drag.dragHandleProps} className={`board-card ${dragSnapshot.isDragging ? 'board-dragging' : ''}`}>
                    <TaskCardContent task={task} to={`/w/${workspaceId}/p/${task.projectId}/t/${task.id}`} labels={labels} members={members} />
                  </li>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            {tasks.length === 0 && !snapshot.isDraggingOver && <li className="board-empty-column">{totalInColumn > 0 ? 'No matching tasks' : 'No tasks'}</li>}
          </ol>
        )}
      </Droppable>

      {canWrite && (
        <button className="btn btn--ghost btn--sm board-add-task" onClick={onAddTask}>
          <Icon name="plus" size={14} /> Add task
        </button>
      )}
    </section>
  )
}

function AddColumn({ projectId, columnCount, onChanged }) {
  const dispatch = useDispatch()
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    if (!name.trim()) return
    if (columnCount >= 10) {
      setError('A board can have at most 10 columns.')
      return
    }
    try {
      await api.columns.create(projectId, name.trim())
      setName('')
      setError('')
      onChanged()
    } catch (err) {
      dispatch(toast(err.message, 'error'))
    }
  }

  return (
    <form className="board-column board-add-column" onSubmit={submit}>
      <label htmlFor="new-column" className="field-label">Add a column</label>
      <input id="new-column" className="input" placeholder="e.g. Blocked" value={name} maxLength={30} onChange={(e) => setName(e.target.value)} />
      {error && <span className="field-error">{error}</span>}
      <button className="btn btn--outline btn--sm" type="submit"><Icon name="plus" size={14} /> Add column</button>
    </form>
  )
}

function CreateTaskModal({ column, projectId, members, labels, onClose, onDone }) {
  const dispatch = useDispatch()
  const [form, setForm] = useState(blankTask)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (form.title.trim().length < 1) {
      setError('Title is required.')
      return
    }
    setBusy(true)
    try {
      await api.tasks.create(projectId, { ...form, title: form.title.trim(), columnId: column.id })
      dispatch(toast('Task created.', 'success'))
      onDone()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <Modal open title={`New task in ${column.name}`} onClose={onClose}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <TaskFields idPrefix="new-task" value={form} onChange={setForm} members={members} labels={labels} errors={error ? { title: error } : {}} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button type="button" className="btn btn--outline" onClick={onClose}>Cancel</button>
          <button className="btn btn--primary" type="submit" disabled={busy}>Create task</button>
        </div>
      </form>
    </Modal>
  )
}

export default Board
