const Project = require('../models/Project')
const Column = require('../models/Column')
const Task = require('../models/Task')
const Comment = require('../models/Comment')
const Activity = require('../models/Activity')
const Membership = require('../models/Membership')
const { can } = require('../utils/permissions')

const roleOf = async (workspaceId, userId) => {
  const m = await Membership.findOne({ workspace: workspaceId, user: userId })
  return m ? m.role : null
}

const listProjects = async (req, res) => {
  try {
    const role = await roleOf(req.params.id, req.user._id)
    if (!role) {
      return res.status(403).json({ message: 'You are not a member of this workspace.' })
    }
    const projects = await Project.find({ workspace: req.params.id }).sort({ createdAt: 1 })
    const result = []
    for (const p of projects) {
      const taskCount = await Task.countDocuments({ project: p._id })
      result.push({ id: p._id, workspace: p.workspace, name: p.name, description: p.description, createdAt: p.createdAt, taskCount })
    }
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const createProject = async (req, res) => {
  try {
    const role = await roleOf(req.params.id, req.user._id)
    if (!can(role, 'project:manage')) {
      return res.status(403).json({ message: 'You cannot create projects.' })
    }
    const { name, description } = req.body
    const project = await Project.create({ workspace: req.params.id, name, description: description || '' })
    const names = ['To Do', 'In Progress', 'Review', 'Done']
    for (let i = 0; i < names.length; i++) {
      await Column.create({ project: project._id, name: names[i], position: i })
    }
    await Activity.create({ workspace: req.params.id, project: project._id, actor: req.user._id, type: 'project.created', data: { name } })
    res.status(201).json(project)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const getBoard = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' })
    }
    const role = await roleOf(project.workspace, req.user._id)
    if (!role) {
      return res.status(403).json({ message: 'You are not a member of this workspace.' })
    }
    const columns = await Column.find({ project: project._id }).sort({ position: 1 })
    const tasks = await Task.find({ project: project._id }).sort({ position: 1 })
    res.json({ project, columns, tasks })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' })
    }
    const role = await roleOf(project.workspace, req.user._id)
    if (!can(role, 'project:manage')) {
      return res.status(403).json({ message: 'You cannot edit this project.' })
    }
    const { name, description } = req.body
    project.name = name
    project.description = description || ''
    await project.save()
    await Activity.create({ workspace: project.workspace, project: project._id, actor: req.user._id, type: 'project.updated', data: { name } })
    res.json(project)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' })
    }
    const role = await roleOf(project.workspace, req.user._id)
    if (!can(role, 'project:manage')) {
      return res.status(403).json({ message: 'You cannot delete this project.' })
    }
    const tasks = await Task.find({ project: project._id })
    const taskIds = tasks.map((t) => t._id)
    await Comment.deleteMany({ task: { $in: taskIds } })
    await Task.deleteMany({ project: project._id })
    await Column.deleteMany({ project: project._id })
    await Activity.deleteMany({ project: project._id })
    await Project.deleteOne({ _id: project._id })
    res.json({ message: 'Project deleted.' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { listProjects, createProject, getBoard, updateProject, deleteProject }
