import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { api } from '../api/client'
import { toast } from '../features/ui/uiSlice'
import { timeAgo } from '../app/format'
import { useWorkspace } from '../components/WorkspaceLayout'
import Modal from '../components/Modal'
import TaskFields from '../components/TaskFields'
import { PriorityBadge, LabelChip, DueBadge } from '../components/TaskCard'
import '../components/tasks.css'

function toInput(t) {
  return { title: t.title, description: t.description, assigneeId: t.assigneeId, dueDate: t.dueDate, priority: t.priority, labelIds: t.labelIds }
}

function TaskDrawer() {
  const { workspace, can, reloadBoard } = useWorkspace()
  const { projectId, taskId } = useParams()
  const navigate = useNavigate()

  const [task, setTask] = useState(null)
  const [members, setMembers] = useState([])
  const [labels, setLabels] = useState([])
  const [status, setStatus] = useState('loading')

  const close = () => navigate(`/w/${workspace.id}/p/${projectId}`)

  useEffect(() => {
    let active = true
    setStatus('loading')
    api.tasks
      .get(taskId)
      .then((t) => { if (active) { setTask(t); setStatus('ready') } })
      .catch(() => { if (active) setStatus('error') })
    api.members.list(workspace.id).then((m) => active && setMembers(m)).catch(() => {})
    api.labels.list(workspace.id).then((l) => active && setLabels(l)).catch(() => {})
    return () => { active = false }
  }, [taskId, workspace.id])

  return (
    <Modal open variant="drawer" title={task?.title ?? 'Task'} onClose={close}>
      {status === 'loading' && <p className="muted" style={{ textAlign: 'center' }}>Loading task…</p>}
      {status === 'error' && <p className="muted" style={{ textAlign: 'center' }}>This task was not found. It may have been deleted.</p>}
      {status === 'ready' && task && (
        <div className="task-drawer">
          <TaskEditor
            task={task}
            members={members}
            labels={labels}
            canWrite={can('task:write')}
            onSaved={(updated) => { setTask(updated); reloadBoard() }}
          />
        </div>
      )}
    </Modal>
  )
}

function TaskEditor({ task, members, labels, canWrite, canDelete, onSaved, onDeleted }) {
  const dispatch = useDispatch()
  const [form, setForm] = useState(() => toInput(task))
  const [busy, setBusy] = useState(false)
  const dirty = JSON.stringify(form) !== JSON.stringify(toInput(task))

  const creator = members.find((m) => m.user.id === task.createdBy)?.user.name ?? 'a former member'
  const assignee = members.find((m) => m.user.id === task.assigneeId)?.user.name

  async function submit(e) {
    e.preventDefault()
    if (form.title.trim().length < 1) return
    setBusy(true)
    try {
      const updated = await api.tasks.update(task.id, { ...form, title: form.title.trim() })
      onSaved(updated)
      dispatch(toast('Task saved.', 'success'))
    } catch (err) {
      dispatch(toast(err.message, 'error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="task-section">
      <p className="muted" style={{ fontSize: '0.82rem' }}>
        Created by {creator} {timeAgo(task.createdAt)} · updated {timeAgo(task.updatedAt)}
      </p>

      {canWrite ? (
        <form onSubmit={submit} className="task-editor">
          <TaskFields idPrefix={`edit-${task.id}`} value={form} onChange={setForm} members={members} labels={labels} errors={{}} />
          <div className="task-inline-actions">
            <span style={{ flex: 1 }} />
            {dirty && <button type="button" className="btn btn--outline" onClick={() => setForm(toInput(task))}>Discard changes</button>}
            <button className="btn btn--primary" type="submit" disabled={!dirty || busy}>Save changes</button>
          </div>
        </form>
      ) : (
        <div className="task-read-only">
          <p className="alert alert--info"><Icon name="alert" size={16} /> You have read-only access to this workspace.</p>
          <p className="task-description">{task.description || <span className="muted">No description</span>}</p>
          <dl>
            <dt>Assignee</dt>
            <dd>{assignee ?? 'Unassigned'}</dd>
            <dt>Priority</dt>
            <dd><PriorityBadge priority={task.priority} /></dd>
            <dt>Due</dt>
            <dd>{task.dueDate ? <DueBadge date={task.dueDate} /> : 'No due date'}</dd>
            <dt>Labels</dt>
            <dd className="task-labels-row">
              {task.labelIds.length === 0 ? 'None' : task.labelIds.map((id) => {
                const l = labels.find((x) => x.id === id)
                return l ? <LabelChip key={id} label={l} /> : null
              })}
            </dd>
          </dl>
        </div>
      )}
    </section>
  )
}

export default TaskDrawer
