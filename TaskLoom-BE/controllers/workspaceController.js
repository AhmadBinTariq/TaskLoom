const Workspace = require('../models/Workspace')
const Membership = require('../models/Membership')
const Project = require('../models/Project')
const Column = require('../models/Column')
const Task = require('../models/Task')
const Comment = require('../models/Comment')
const Label = require('../models/Label')
const Invitation = require('../models/Invitation')
const Activity = require('../models/Activity')
const { can } = require('../utils/permissions')

const listWorkspaces = async (req, res) => {
  try {
    const memberships = await Membership.find({ user: req.user._id }).populate('workspace')
    const workspaces = memberships
      .filter((m) => m.workspace)
      .map((m) => ({ id: m.workspace._id, name: m.workspace.name, createdAt: m.workspace.createdAt, myRole: m.role }))
      .sort((a, b) => a.name.localeCompare(b.name))
    res.json(workspaces)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const getWorkspace = async (req, res) => {
  try {
    const membership = await Membership.findOne({ workspace: req.params.id, user: req.user._id })
    if (!membership) {
      return res.status(403).json({ message: 'You are not a member of this workspace.' })
    }
    const workspace = await Workspace.findById(req.params.id)
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found.' })
    }
    res.json({ id: workspace._id, name: workspace.name, createdAt: workspace.createdAt, myRole: membership.role })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const createWorkspace = async (req, res) => {
  try {
    const { name } = req.body
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: 'Workspace name must be at least 2 characters.' })
    }
    const workspace = await Workspace.create({ name: name.trim() })
    await Membership.create({ workspace: workspace._id, user: req.user._id, role: 'owner' })
    res.status(201).json({ id: workspace._id, name: workspace.name, createdAt: workspace.createdAt, myRole: 'owner' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const renameWorkspace = async (req, res) => {
  try {
    const membership = await Membership.findOne({ workspace: req.params.id, user: req.user._id })
    if (!membership || !can(membership.role, 'workspace:rename')) {
      return res.status(403).json({ message: 'You cannot rename this workspace.' })
    }
    const workspace = await Workspace.findByIdAndUpdate(req.params.id, { name: req.body.name }, { new: true, runValidators: true })
    res.json({ id: workspace._id, name: workspace.name, createdAt: workspace.createdAt, myRole: membership.role })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const deleteWorkspace = async (req, res) => {
  try {
    const membership = await Membership.findOne({ workspace: req.params.id, user: req.user._id })
    if (!membership || !can(membership.role, 'workspace:delete')) {
      return res.status(403).json({ message: 'Only the owner can delete this workspace.' })
    }
    const projects = await Project.find({ workspace: req.params.id })
    const projectIds = projects.map((p) => p._id)
    const tasks = await Task.find({ workspace: req.params.id })
    const taskIds = tasks.map((t) => t._id)
    await Comment.deleteMany({ task: { $in: taskIds } })
    await Task.deleteMany({ workspace: req.params.id })
    await Column.deleteMany({ project: { $in: projectIds } })
    await Project.deleteMany({ workspace: req.params.id })
    await Label.deleteMany({ workspace: req.params.id })
    await Invitation.deleteMany({ workspace: req.params.id })
    await Activity.deleteMany({ workspace: req.params.id })
    await Membership.deleteMany({ workspace: req.params.id })
    await Workspace.deleteOne({ _id: req.params.id })
    res.json({ message: 'Workspace deleted.' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const leaveWorkspace = async (req, res) => {
  try {
    const membership = await Membership.findOne({ workspace: req.params.id, user: req.user._id })
    if (!membership) {
      return res.status(403).json({ message: 'You are not a member of this workspace.' })
    }
    if (membership.role === 'owner') {
      return res.status(400).json({ message: 'The owner cannot leave. Delete the workspace instead.' })
    }
    await Membership.deleteOne({ _id: membership._id })
    res.json({ message: 'You left the workspace.' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { listWorkspaces, getWorkspace, createWorkspace, renameWorkspace, deleteWorkspace, leaveWorkspace }
