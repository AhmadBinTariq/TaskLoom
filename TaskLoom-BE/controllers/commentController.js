const Comment = require('../models/Comment')
const Task = require('../models/Task')
const Activity = require('../models/Activity')
const Membership = require('../models/Membership')
const { can } = require('../utils/permissions')

const roleOf = async (workspaceId, userId) => {
  const m = await Membership.findOne({ workspace: workspaceId, user: userId })
  return m ? m.role : null
}

const listComments = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' })
    }
    const role = await roleOf(task.workspace, req.user._id)
    if (!role) {
      return res.status(403).json({ message: 'You are not a member of this workspace.' })
    }
    const comments = await Comment.find({ task: task._id }).populate('author').sort({ createdAt: 1 })
    const result = comments.map((c) => ({
      id: c._id,
      body: c.body,
      mentions: c.mentions,
      createdAt: c.createdAt,
      author: c.author ? { id: c.author._id, name: c.author.name, email: c.author.email } : null,
    }))
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const createComment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' })
    }
    const role = await roleOf(task.workspace, req.user._id)
    if (!can(role, 'comment:create')) {
      return res.status(403).json({ message: 'You cannot comment.' })
    }
    const { body } = req.body
    if (!body || !body.trim()) {
      return res.status(400).json({ message: 'Comment cannot be empty.' })
    }
    const mentions = req.body.mentions || req.body.mentionIds || []
    const comment = await Comment.create({ task: task._id, author: req.user._id, body: body.trim(), mentions })
    await Activity.create({ workspace: task.workspace, project: task.project, task: task._id, actor: req.user._id, type: 'comment.created', data: { title: task.title } })
    res.status(201).json({
      id: comment._id,
      body: comment.body,
      mentions: comment.mentions,
      createdAt: comment.createdAt,
      author: { id: req.user._id, name: req.user.name, email: req.user.email },
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { listComments, createComment }
