const Workspace = require('../models/Workspace')
const Membership = require('../models/Membership')
const Project = require('../models/Project')
const Column = require('../models/Column')
const Task = require('../models/Task')
const Comment = require('../models/Comment')
const Label = require('../models/Label')
const Invitation = require('../models/Invitation')
const Activity = require('../models/Activity')
const { wrapAll } = require('../utils/asyncHandler')
const { requireText } = require('../utils/validate')
const { permissionsFor } = require('../utils/permissions')

// `permissions` lets the frontend show/hide actions using the server's own rules.
const shape = (workspace, role) => ({
  id: workspace._id,
  name: workspace.name,
  createdAt: workspace.createdAt,
  myRole: role,
  permissions: permissionsFor(role),
})

const listWorkspaces = async (req, res) => {
  const memberships = await Membership.find({ user: req.user._id }).populate('workspace')
  const workspaces = memberships
    .filter((m) => m.workspace)
    .map((m) => shape(m.workspace, m.role))
    .sort((a, b) => a.name.localeCompare(b.name))
  res.json(workspaces)
}

// access('workspace', 'workspace:read') has already loaded req.workspace and req.role.
const getWorkspace = async (req, res) => {
  res.json(shape(req.workspace, req.role))
}

const createWorkspace = async (req, res) => {
  const name = requireText(req.body.name, 'Workspace name', { min: 2, max: 50 })
  const workspace = await Workspace.create({ name })
  await Membership.create({ workspace: workspace._id, user: req.user._id, role: 'owner' })
  res.status(201).json(shape(workspace, 'owner'))
}

const renameWorkspace = async (req, res) => {
  req.workspace.name = requireText(req.body.name, 'Workspace name', { min: 2, max: 50 })
  await req.workspace.save()
  res.json(shape(req.workspace, req.role))
}

const deleteWorkspace = async (req, res) => {
  const workspace = req.workspaceId
  const projectIds = await Project.find({ workspace }).distinct('_id')
  const taskIds = await Task.find({ workspace }).distinct('_id')
  await Comment.deleteMany({ task: { $in: taskIds } })
  await Task.deleteMany({ workspace })
  await Column.deleteMany({ project: { $in: projectIds } })
  await Project.deleteMany({ workspace })
  await Label.deleteMany({ workspace })
  await Invitation.deleteMany({ workspace })
  await Activity.deleteMany({ workspace })
  await Membership.deleteMany({ workspace })
  await Workspace.deleteOne({ _id: workspace })
  res.json({ message: 'Workspace deleted.' })
}

// The owner is blocked by the 'workspace:leave' permission on the route.
const leaveWorkspace = async (req, res) => {
  await Membership.deleteOne({ _id: req.membership._id })
  await Task.updateMany({ workspace: req.workspaceId, assignee: req.user._id }, { assignee: null })
  res.json({ message: 'You left the workspace.' })
}

module.exports = wrapAll({ listWorkspaces, getWorkspace, createWorkspace, renameWorkspace, deleteWorkspace, leaveWorkspace })
