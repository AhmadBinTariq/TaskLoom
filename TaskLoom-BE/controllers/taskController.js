const Task = require('../models/Task')
const Column = require('../models/Column')
const Project = require('../models/Project')
const Comment = require('../models/Comment')
const Activity = require('../models/Activity')
const Membership = require('../models/Membership')
const Label = require('../models/Label')
const { wrapAll } = require('../utils/asyncHandler')
const { badRequest, forbidden, conflict } = require('../utils/ApiError')
const { isId, requireId, requireText, requireOneOf, optionalDate } = require('../utils/validate')
const { canDeleteTask, deniedMessage } = require('../utils/permissions')

const PRIORITIES = ['low', 'medium', 'high']
const FIELD_NAMES = { title: 'title', description: 'description', assignee: 'assignee', dueDate: 'due date', priority: 'priority', labels: 'labels' }
const SEARCH_LIMIT = 50

// ---------------------------------------------------------------- input checks

const checkDescription = (value) => {
  if (value === undefined || value === null) return ''
  if (typeof value !== 'string') throw badRequest('Description must be text.')
  if (value.length > 5000) throw badRequest('Description must be at most 5000 characters.')
  return value
}

// The assignee has to be a member of the same workspace.
const checkAssignee = async (value, workspaceId) => {
  if (value === undefined || value === null || value === '') return null
  const userId = requireId(String(value), 'assignee')
  if (!(await Membership.exists({ workspace: workspaceId, user: userId }))) {
    throw badRequest('The assignee must be a member of this workspace.')
  }
  return userId
}

// Labels have to belong to the same workspace.
const checkLabels = async (value, workspaceId) => {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) throw badRequest('Labels must be a list.')
  const ids = [...new Set(value.map((id) => requireId(String(id), 'label id')))]
  if (ids.length && (await Label.countDocuments({ _id: { $in: ids }, workspace: workspaceId })) !== ids.length) {
    throw badRequest('One or more labels do not belong to this workspace.')
  }
  return ids
}

// Reads task fields from the body (accepts both `assignee`/`labels` and the
// frontend's `assigneeId`/`labelIds`). With `partial`, only sent fields are returned.
const readTaskInput = async (body, workspaceId, { partial }) => {
  const sent = (key) => body[key] !== undefined
  const assigneeRaw = sent('assignee') ? body.assignee : body.assigneeId
  const labelsRaw = sent('labels') ? body.labels : body.labelIds
  const input = {}
  if (!partial || sent('title')) input.title = requireText(body.title, 'Title', { max: 120 })
  if (!partial || sent('description')) input.description = checkDescription(body.description)
  if (!partial || assigneeRaw !== undefined) input.assignee = await checkAssignee(assigneeRaw, workspaceId)
  if (!partial || sent('dueDate')) input.dueDate = optionalDate(body.dueDate)
  if (!partial || sent('priority')) input.priority = body.priority === undefined ? 'medium' : requireOneOf(body.priority, PRIORITIES, 'Priority')
  if (!partial || labelsRaw !== undefined) input.labels = await checkLabels(labelsRaw, workspaceId)
  return input
}

const sameValue = (key, a, b) => {
  if (key === 'labels') return JSON.stringify((a || []).map(String)) === JSON.stringify((b || []).map(String))
  if (key === 'assignee') return String(a || '') === String(b || '')
  return (a ?? null) === (b ?? null)
}

const logActivity = (task, actor, type, data) =>
  Activity.create({ workspace: task.workspace, project: task.project, task: task._id, actor, type, data })

// ---------------------------------------------------------------- handlers

// POST /api/projects/:id/tasks – access('project', 'task:write') loaded req.project.
const createTask = async (req, res) => {
  const { project } = req
  const input = await readTaskInput(req.body, project.workspace, { partial: false })
  const column = await Column.findOne({ _id: requireId(req.body.columnId, 'column id'), project: project._id })
  if (!column) throw badRequest('That column does not exist in this project.')

  const last = await Task.findOne({ column: column._id }).sort({ position: -1 })
  const task = await Task.create({
    ...input,
    workspace: project.workspace,
    project: project._id,
    column: column._id,
    position: last ? last.position + 1000 : 1000,
    createdBy: req.user._id,
  })
  await logActivity(task, req.user._id, 'task.created', { title: task.title, column: column.name })
  res.status(201).json(task)
}

// access('task', ...) loaded req.task for the handlers below.
const getTask = async (req, res) => {
  res.json(req.task)
}

const updateTask = async (req, res) => {
  const { task } = req
  const input = await readTaskInput(req.body, task.workspace, { partial: true })
  const changed = Object.keys(input).filter((key) => !sameValue(key, task[key], input[key]))
  if (changed.length === 0) return res.json(task)

  changed.forEach((key) => { task[key] = input[key] })
  await task.save()
  await logActivity(task, req.user._id, 'task.updated', { title: task.title, fields: changed.map((k) => FIELD_NAMES[k]).join(', ') })
  res.json(task)
}

// Positions are fractional: a task dropped between two others gets the midpoint, so a
// move only ever updates the moved task. If the task it was dropped after is gone
// (someone else changed the board), the client gets 409 and reloads.
const moveTask = async (req, res) => {
  const { task } = req
  const columnId = requireId(req.body.columnId, 'column id')
  const { afterTaskId } = req.body
  if (afterTaskId !== null && afterTaskId !== undefined && !isId(afterTaskId)) throw badRequest('Invalid afterTaskId.')

  const target = await Column.findOne({ _id: columnId, project: task.project })
  if (!target) throw badRequest('That column does not exist in this project.')

  const siblings = await Task.find({ column: columnId, _id: { $ne: task._id } }).sort({ position: 1 })
  let position
  if (!afterTaskId) {
    position = siblings.length ? siblings[0].position - 1000 : 1000
  } else {
    const idx = siblings.findIndex((t) => String(t._id) === String(afterTaskId))
    if (idx === -1) throw conflict('The board changed. Please refresh.')
    const next = siblings[idx + 1]
    position = next ? (siblings[idx].position + next.position) / 2 : siblings[idx].position + 1000
  }

  const fromColumn = String(task.column) !== columnId ? await Column.findById(task.column) : null
  task.column = columnId
  task.position = position
  await task.save()
  if (fromColumn) {
    await logActivity(task, req.user._id, 'task.moved', { title: task.title, from: fromColumn.name, to: target.name })
  }
  res.json(task)
}

// Route allows 'task:delete-any' (Owner/Admin) or 'task:delete-own' (Member);
// a Member must also be the task's creator.
const deleteTask = async (req, res) => {
  const { task } = req
  if (!canDeleteTask(req.role, req.user._id, task.createdBy)) throw forbidden(deniedMessage('task:delete-any'))
  await Comment.deleteMany({ task: task._id })
  await Task.deleteOne({ _id: task._id })
  await Activity.create({ workspace: task.workspace, project: task.project, actor: req.user._id, type: 'task.deleted', data: { title: task.title } })
  res.json({ message: 'Task deleted.' })
}

// ---------------------------------------------------------------- search

const pad = (n) => String(n).padStart(2, '0')
const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const addDays = (iso, days) => {
  const [y, m, d] = iso.split('-').map(Number)
  return isoDate(new Date(y, m - 1, d + days))
}

const matches = (task, f, today) => {
  const text = f.text.trim().toLowerCase()
  if (text && !task.title.toLowerCase().includes(text) && !task.description.toLowerCase().includes(text)) return false
  if (f.assigneeId === 'unassigned' && task.assignee) return false
  if (isId(f.assigneeId) && String(task.assignee) !== f.assigneeId) return false
  if (isId(f.labelId) && !task.labels.map(String).includes(f.labelId)) return false
  if (PRIORITIES.includes(f.priority) && task.priority !== f.priority) return false
  if (f.due === 'none') return task.dueDate === null
  if (f.due === 'overdue') return task.dueDate !== null && task.dueDate < today
  if (f.due === 'today') return task.dueDate === today
  if (f.due === 'week') return task.dueDate !== null && task.dueDate >= today && task.dueDate <= addDays(today, 7)
  return true
}

// GET /api/workspaces/:id/search – access('workspace', 'task:read').
const searchTasks = async (req, res) => {
  const q = (key, fallback) => (typeof req.query[key] === 'string' ? req.query[key] : fallback)
  const filters = { text: q('text', ''), assigneeId: q('assigneeId', 'any'), labelId: q('labelId', 'any'), priority: q('priority', 'any'), due: q('due', 'any') }
  const today = isoDate(new Date())

  const tasks = await Task.find({ workspace: req.workspaceId }).sort({ updatedAt: -1 })
  const hits = tasks.filter((t) => matches(t, filters, today)).slice(0, SEARCH_LIMIT)

  const projects = await Project.find({ workspace: req.workspaceId }, 'name')
  const columns = await Column.find({ project: { $in: projects.map((p) => p._id) } }, 'name')
  const projectName = new Map(projects.map((p) => [String(p._id), p.name]))
  const columnName = new Map(columns.map((c) => [String(c._id), c.name]))

  res.json(hits.map((task) => ({
    task,
    projectName: projectName.get(String(task.project)) || '',
    columnName: columnName.get(String(task.column)) || '',
  })))
}

module.exports = wrapAll({ createTask, getTask, updateTask, moveTask, deleteTask, searchTasks })
