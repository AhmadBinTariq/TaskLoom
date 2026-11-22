const Column = require('../models/Column')
const Task = require('../models/Task')
const Activity = require('../models/Activity')
const { wrapAll } = require('../utils/asyncHandler')
const { badRequest, conflict } = require('../utils/ApiError')
const { requireText } = require('../utils/validate')

const MAX_COLUMNS = 10

// POST /api/projects/:id/columns – access('project', 'column:manage') loaded req.project.
const createColumn = async (req, res) => {
  const { project } = req
  const name = requireText(req.body.name, 'Column name', { max: 30 })
  const existing = await Column.find({ project: project._id })
  if (existing.length >= MAX_COLUMNS) throw badRequest(`A board can have at most ${MAX_COLUMNS} columns.`)
  const position = existing.length ? Math.max(...existing.map((c) => c.position)) + 1 : 0
  const column = await Column.create({ project: project._id, name, position })
  await Activity.create({ workspace: project.workspace, project: project._id, actor: req.user._id, type: 'column.created', data: { name } })
  res.status(201).json(column)
}

// access('column', 'column:manage') loaded req.column and req.project.
const renameColumn = async (req, res) => {
  const { column, project } = req
  const from = column.name
  column.name = requireText(req.body.name, 'Column name', { max: 30 })
  await column.save()
  await Activity.create({ workspace: project.workspace, project: project._id, actor: req.user._id, type: 'column.renamed', data: { from, to: column.name } })
  res.json(column)
}

const deleteColumn = async (req, res) => {
  const { column, project } = req
  if (await Task.exists({ column: column._id })) throw conflict('Move or delete the tasks in this column first.')
  if ((await Column.countDocuments({ project: project._id })) <= 1) throw badRequest('A board needs at least one column.')
  await Column.deleteOne({ _id: column._id })
  await Activity.create({ workspace: project.workspace, project: project._id, actor: req.user._id, type: 'column.deleted', data: { name: column.name } })
  res.json({ message: 'Column deleted.' })
}

module.exports = wrapAll({ createColumn, renameColumn, deleteColumn })
