const Column = require('../models/Column')
const Task = require('../models/Task')
const Project = require('../models/Project')
const Membership = require('../models/Membership')
const Activity = require('../models/Activity')
const { can } = require('../utils/permissions')

const roleOf = async (workspaceId, userId) => {
  const m = await Membership.findOne({ workspace: workspaceId, user: userId })
  return m ? m.role : null
}

const createColumn = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' })
    }
    const role = await roleOf(project.workspace, req.user._id)
    if (!can(role, 'project:manage')) {
      return res.status(403).json({ message: 'You cannot add columns.' })
    }
    const existing = await Column.find({ project: project._id })
    if (existing.length >= 10) {
      return res.status(400).json({ message: 'A board can have at most 10 columns.' })
    }
    const position = existing.length ? Math.max(...existing.map((c) => c.position)) + 1 : 0
    const column = await Column.create({ project: project._id, name: req.body.name, position })
    await Activity.create({ workspace: project.workspace, project: project._id, actor: req.user._id, type: 'column.created', data: { name: req.body.name } })
    res.status(201).json(column)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const renameColumn = async (req, res) => {
  try {
    const column = await Column.findById(req.params.id)
    if (!column) {
      return res.status(404).json({ message: 'Column not found.' })
    }
    const project = await Project.findById(column.project)
    const role = await roleOf(project.workspace, req.user._id)
    if (!can(role, 'project:manage')) {
      return res.status(403).json({ message: 'You cannot rename columns.' })
    }
    const from = column.name
    column.name = req.body.name
    await column.save()
    await Activity.create({ workspace: project.workspace, project: project._id, actor: req.user._id, type: 'column.renamed', data: { from, to: req.body.name } })
    res.json(column)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const deleteColumn = async (req, res) => {
  try {
    const column = await Column.findById(req.params.id)
    if (!column) {
      return res.status(404).json({ message: 'Column not found.' })
    }
    const project = await Project.findById(column.project)
    const role = await roleOf(project.workspace, req.user._id)
    if (!can(role, 'project:manage')) {
      return res.status(403).json({ message: 'You cannot delete columns.' })
    }
    const taskCount = await Task.countDocuments({ column: column._id })
    if (taskCount > 0) {
      return res.status(409).json({ message: 'Move or delete the tasks in this column first.' })
    }
    const columnCount = await Column.countDocuments({ project: project._id })
    if (columnCount <= 1) {
      return res.status(400).json({ message: 'A board needs at least one column.' })
    }
    await Column.deleteOne({ _id: column._id })
    await Activity.create({ workspace: project.workspace, project: project._id, actor: req.user._id, type: 'column.deleted', data: { name: column.name } })
    res.json({ message: 'Column deleted.' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { createColumn, renameColumn, deleteColumn }
