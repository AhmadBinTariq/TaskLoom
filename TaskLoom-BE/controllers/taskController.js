const Task = require('../models/Task')
const Column = require('../models/Column')
const Project = require('../models/Project')
const Comment = require('../models/Comment')
const Activity = require('../models/Activity')
const Membership = require('../models/Membership')
const { can, canDeleteTask } = require('../utils/permissions')

const roleOf = async (workspaceId, userId) => {
  const m = await Membership.findOne({ workspace: workspaceId, user: userId })
  return m ? m.role : null
}

const todayIso = () => {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const addDays = (iso, days) => {
  const [y, m, d] = iso.split('-').map(Number)
  const next = new Date(y, m - 1, d + days)
  const pad = (n) => String(n).padStart(2, '0')
  return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`
}

const matches = (task, f, today) => {
  const text = (f.text || '').trim().toLowerCase()
  if (text && !task.title.toLowerCase().includes(text) && !task.description.toLowerCase().includes(text)) return false
  if (f.assigneeId === 'unassigned' && task.assignee) return false
  if (f.assigneeId && f.assigneeId !== 'any' && f.assigneeId !== 'unassigned' && String(task.assignee) !== f.assigneeId) return false
  if (f.labelId && f.labelId !== 'any' && !task.labels.map(String).includes(f.labelId)) return false
  if (f.priority && f.priority !== 'any' && task.priority !== f.priority) return false
  if (f.due === 'none') return task.dueDate === null
  if (f.due === 'overdue') return task.dueDate !== null && task.dueDate < today
  if (f.due === 'today') return task.dueDate === today
  if (f.due === 'week') return task.dueDate !== null && task.dueDate >= today && task.dueDate <= addDays(today, 7)
  return true
}

const readInput = (body) => ({
  title: body.title,
  description: body.description || '',
  assignee: body.assignee !== undefined ? body.assignee : body.assigneeId ?? null,
  dueDate: body.dueDate ?? null,
  priority: body.priority || 'medium',
  labels: body.labels || body.labelIds || [],
})

const createTask = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' })
    }
    const role = await roleOf(project.workspace, req.user._id)
    if (!can(role, 'task:write')) {
      return res.status(403).json({ message: 'You cannot create tasks.' })
    }
    const input = readInput(req.body)
    if (!input.title || !input.title.trim()) {
      return res.status(400).json({ message: 'Title is required.' })
    }
    const column = await Column.findById(req.body.columnId)
    if (!column || String(column.project) !== String(project._id)) {
      return res.status(400).json({ message: 'That column does not exist in this project.' })
    }
    const inColumn = await Task.find({ column: column._id })
    const position = inColumn.length ? Math.max(...inColumn.map((t) => t.position)) + 1000 : 1000
    const task = await Task.create({
      workspace: project.workspace,
      project: project._id,
      column: column._id,
      title: input.title.trim(),
      description: input.description,
      assignee: input.assignee,
      dueDate: input.dueDate,
      priority: input.priority,
      labels: input.labels,
      position,
      createdBy: req.user._id,
    })
    await Activity.create({ workspace: project.workspace, project: project._id, task: task._id, actor: req.user._id, type: 'task.created', data: { title: task.title, column: column.name } })
    res.status(201).json(task)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' })
    }
    const role = await roleOf(task.workspace, req.user._id)
    if (!role) {
      return res.status(403).json({ message: 'You are not a member of this workspace.' })
    }
    res.json(task)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' })
    }
    const role = await roleOf(task.workspace, req.user._id)
    if (!can(role, 'task:write')) {
      return res.status(403).json({ message: 'You cannot edit tasks.' })
    }
    const input = readInput(req.body)
    const names = { title: 'title', description: 'description', assignee: 'assignee', dueDate: 'due date', priority: 'priority', labels: 'labels' }
    const changed = []
    if (task.title !== input.title) changed.push('title')
    if (task.description !== input.description) changed.push('description')
    if (String(task.assignee || '') !== String(input.assignee || '')) changed.push('assignee')
    if ((task.dueDate || null) !== (input.dueDate || null)) changed.push('dueDate')
    if (task.priority !== input.priority) changed.push('priority')
    if (JSON.stringify(task.labels.map(String)) !== JSON.stringify((input.labels || []).map(String))) changed.push('labels')
    if (changed.length === 0) {
      return res.json(task)
    }
    task.title = input.title
    task.description = input.description
    task.assignee = input.assignee
    task.dueDate = input.dueDate
    task.priority = input.priority
    task.labels = input.labels
    await task.save()
    await Activity.create({ workspace: task.workspace, project: task.project, task: task._id, actor: req.user._id, type: 'task.updated', data: { title: task.title, fields: changed.map((k) => names[k]).join(', ') } })
    res.json(task)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const moveTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' })
    }
    const role = await roleOf(task.workspace, req.user._id)
    if (!can(role, 'task:write')) {
      return res.status(403).json({ message: 'You cannot move tasks.' })
    }
    const { columnId, afterTaskId } = req.body
    const target = await Column.findById(columnId)
    if (!target || String(target.project) !== String(task.project)) {
      return res.status(400).json({ message: 'That column does not exist in this project.' })
    }
    const siblings = (await Task.find({ column: columnId })).filter((t) => String(t._id) !== String(task._id)).sort((a, b) => a.position - b.position)
    let position
    if (!afterTaskId) {
      position = siblings.length ? siblings[0].position - 1000 : 1000
    } else {
      const idx = siblings.findIndex((t) => String(t._id) === String(afterTaskId))
      if (idx === -1) {
        return res.status(409).json({ message: 'The board changed. Please refresh.' })
      }
      const next = siblings[idx + 1]
      position = next ? (siblings[idx].position + next.position) / 2 : siblings[idx].position + 1000
    }
    const fromColumn = await Column.findById(task.column)
    const changedColumn = String(task.column) !== String(columnId)
    task.column = columnId
    task.position = position
    await task.save()
    if (changedColumn) {
      await Activity.create({ workspace: task.workspace, project: task.project, task: task._id, actor: req.user._id, type: 'task.moved', data: { title: task.title, from: fromColumn ? fromColumn.name : '', to: target.name } })
    }
    res.json(task)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' })
    }
    const role = await roleOf(task.workspace, req.user._id)
    if (!canDeleteTask(role, req.user._id, task.createdBy)) {
      return res.status(403).json({ message: 'You can only delete tasks you created.' })
    }
    await Comment.deleteMany({ task: task._id })
    await Task.deleteOne({ _id: task._id })
    await Activity.create({ workspace: task.workspace, project: task.project, actor: req.user._id, type: 'task.deleted', data: { title: task.title } })
    res.json({ message: 'Task deleted.' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const searchTasks = async (req, res) => {
  try {
    const role = await roleOf(req.params.id, req.user._id)
    if (!role) {
      return res.status(403).json({ message: 'You are not a member of this workspace.' })
    }
    const f = {
      text: req.query.text || '',
      assigneeId: req.query.assigneeId || 'any',
      labelId: req.query.labelId || 'any',
      priority: req.query.priority || 'any',
      due: req.query.due || 'any',
    }
    const today = todayIso()
    const tasks = await Task.find({ workspace: req.params.id }).sort({ updatedAt: -1 })
    const projects = await Project.find({ workspace: req.params.id })
    const columns = await Column.find({})
    const result = tasks
      .filter((t) => matches(t, f, today))
      .slice(0, 50)
      .map((task) => ({
        task,
        projectName: projects.find((p) => String(p._id) === String(task.project))?.name || '',
        columnName: columns.find((c) => String(c._id) === String(task.column))?.name || '',
      }))
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { createTask, getTask, updateTask, moveTask, deleteTask, searchTasks }
