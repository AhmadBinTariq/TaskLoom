import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { api } from '../api/client'
import { toast } from '../features/ui/uiSlice'
import { useWorkspace } from '../components/WorkspaceLayout'
import Modal from '../components/Modal'
import TaskFields from '../components/TaskFields'
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
            onSaved={(updated) => { setTask(updated); reloadBoard() }}
          />
        </div>
      )}
    </Modal>
  )
}

function TaskEditor({ task, members, labels, onSaved }) {
  const dispatch = useDispatch()
  const [form, setForm] = useState(() => toInput(task))
  const [busy, setBusy] = useState(false)

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
      <form onSubmit={submit} className="task-editor">
        <TaskFields idPrefix={`edit-${task.id}`} value={form} onChange={setForm} members={members} labels={labels} errors={{}} />
        <div className="task-inline-actions">
          <span style={{ flex: 1 }} />
          <button className="btn btn--primary" type="submit" disabled={busy}>Save changes</button>
        </div>
      </form>
    </section>
  )
}

export default TaskDrawer
