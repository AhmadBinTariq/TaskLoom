const Project = require('../models/Project')
const Column = require('../models/Column')
const Task = require('../models/Task')
const Comment = require('../models/Comment')
const Activity = require('../models/Activity')
const { wrapAll } = require('../utils/asyncHandler')
const { requireText, optionalText } = require('../utils/validate')

const DEFAULT_COLUMNS = ['To Do', 'In Progress', 'Review', 'Done']

const listProjects = async (req, res) => {
  const projects = await Project.find({ workspace: req.workspaceId }).sort({ createdAt: 1 })
  // One grouped query instead of one count per project.
  const counts = await Task.aggregate([
    { $match: { project: { $in: projects.map((p) => p._id) } } },
    { $group: { _id: '$project', count: { $sum: 1 } } },
  ])
  const countOf = new Map(counts.map((c) => [String(c._id), c.count]))
  res.json(
    projects.map((p) => ({
      id: p._id,
      workspace: p.workspace,
      name: p.name,
      description: p.description,
      createdAt: p.createdAt,
      taskCount: countOf.get(String(p._id)) || 0,
    })),
  )
}

const createProject = async (req, res) => {
  const name = requireText(req.body.name, 'Project name', { min: 2, max: 60 })
  const description = optionalText(req.body.description, 'Description', { max: 500 })
  const project = await Project.create({ workspace: req.workspaceId, name, description })
  await Column.insertMany(DEFAULT_COLUMNS.map((columnName, position) => ({ project: project._id, name: columnName, position })))
  await Activity.create({ workspace: req.workspaceId, project: project._id, actor: req.user._id, type: 'project.created', data: { name } })
  res.status(201).json({ ...project.toObject(), taskCount: 0 })
}

const getBoard = async (req, res) => {
  const columns = await Column.find({ project: req.project._id }).sort({ position: 1 })
  const tasks = await Task.find({ project: req.project._id }).sort({ position: 1 })
  res.json({ project: req.project, columns, tasks })
}

// PATCH semantics: only the fields that are sent are changed.
const updateProject = async (req, res) => {
  const { project } = req
  if (req.body.name !== undefined) project.name = requireText(req.body.name, 'Project name', { min: 2, max: 60 })
  if (req.body.description !== undefined) project.description = optionalText(req.body.description, 'Description', { max: 500 })
  await project.save()
  await Activity.create({ workspace: project.workspace, project: project._id, actor: req.user._id, type: 'project.updated', data: { name: project.name } })
  res.json(project)
}

const deleteProject = async (req, res) => {
  const projectId = req.project._id
  const taskIds = await Task.find({ project: projectId }).distinct('_id')
  await Comment.deleteMany({ task: { $in: taskIds } })
  await Task.deleteMany({ project: projectId })
  await Column.deleteMany({ project: projectId })
  await Activity.deleteMany({ project: projectId })
  await Project.deleteOne({ _id: projectId })
  res.json({ message: 'Project deleted.' })
}

module.exports = wrapAll({ listProjects, createProject, getBoard, updateProject, deleteProject })
