import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { api } from '../api/client'
import { toast } from '../features/ui/uiSlice'
import { useWorkspace } from '../components/WorkspaceLayout'
import PageHeader from '../components/PageHeader'
import { LoadingState, EmptyState } from '../components/States'
import '../components/board.css'

function Board() {
  const workspaceContext = useWorkspace()
  const { workspace, can } = workspaceContext
  const { projectId } = useParams()
  const dispatch = useDispatch()

  const [board, setBoard] = useState(null)
  const [status, setStatus] = useState('loading')

  const reloadBoard = useCallback(() => {
    return api.projects
      .board(projectId)
      .then((b) => { setBoard(b); setStatus('ready') })
      .catch(() => setStatus('error'))
  }, [projectId])

  useEffect(() => {
    setStatus('loading')
    reloadBoard()
  }, [projectId, reloadBoard])

  const reload = () => {
    reloadBoard()
  }

  if (status === 'loading') return <LoadingState label="Loading board…" />
  if (status === 'error' || !board) return <EmptyState title="Project not found">It may have been deleted.</EmptyState>

  const { project, columns, tasks } = board
  const canWrite = can('task:write')

  const visibleByColumn = {}
  for (const t of tasks) {
    if (!visibleByColumn[t.columnId]) visibleByColumn[t.columnId] = []
    visibleByColumn[t.columnId].push(t)
  }

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
      />

      <div className="board-wrap">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="board">
            {columns.map((column) => (
              <BoardColumn
                key={column.id}
                column={column}
                tasks={visibleByColumn[column.id] ?? []}
                totalInColumn={tasks.filter((t) => t.columnId === column.id).length}
                canWrite={canWrite}
              />
            ))}
          </div>
        </DragDropContext>
      </div>
    </>
  )
}

function BoardColumn({ column, tasks, totalInColumn, columnCount, canWrite, canManage, onChanged }) {
  return (
    <section className="board-column">
      <header className="board-column-header">
        <h2 className="board-column-title">{column.name}</h2>
            <span className="board-count">{tasks.length === totalInColumn ? totalInColumn : `${tasks.length}/${totalInColumn}`}</span>
      </header>

      <Droppable droppableId={column.id} isDropDisabled={!canWrite}>
        {(provided, snapshot) => (
          <ol ref={provided.innerRef} {...provided.droppableProps} className={`board-cards ${snapshot.isDraggingOver ? 'board-drop-target' : ''}`}>
            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index} isDragDisabled={!canWrite}>
                {(drag, dragSnapshot) => (
                  <li ref={drag.innerRef} {...drag.draggableProps} {...drag.dragHandleProps} className={`board-card ${dragSnapshot.isDragging ? 'board-dragging' : ''}`}>
                    <span>{task.title}</span>
                  </li>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            {tasks.length === 0 && !snapshot.isDraggingOver && <li className="board-empty-column">No tasks</li>}
          </ol>
        )}
      </Droppable>
    </section>
  )
}

export default Board
