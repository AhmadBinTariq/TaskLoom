const Comment = require('../models/Comment')
const Activity = require('../models/Activity')
const Membership = require('../models/Membership')
const { wrapAll } = require('../utils/asyncHandler')
const { requireText, isId } = require('../utils/validate')

const shapeAuthor = (user) => (user ? { id: user._id, name: user.name, email: user.email } : null)

// access('task', 'comment:read') loaded req.task.
const listComments = async (req, res) => {
  const comments = await Comment.find({ task: req.task._id }).populate('author').sort({ createdAt: 1 })
  res.json(comments.map((c) => ({
    id: c._id,
    body: c.body,
    mentions: c.mentions,
    createdAt: c.createdAt,
    author: shapeAuthor(c.author),
  })))
}

// access('task', 'comment:create') – Viewers are blocked before reaching this.
const createComment = async (req, res) => {
  const { task } = req
  const body = requireText(req.body.body, 'Comment', { max: 2000 })

  // Only keep mentions of people who are actually in this workspace.
  const requested = req.body.mentions || req.body.mentionIds || []
  const candidateIds = [...new Set((Array.isArray(requested) ? requested : []).map(String).filter(isId))]
  const mentions = candidateIds.length
    ? await Membership.find({ workspace: task.workspace, user: { $in: candidateIds } }).distinct('user')
    : []

  const comment = await Comment.create({ task: task._id, author: req.user._id, body, mentions })
  await Activity.create({ workspace: task.workspace, project: task.project, task: task._id, actor: req.user._id, type: 'comment.created', data: { title: task.title } })
  res.status(201).json({
    id: comment._id,
    body: comment.body,
    mentions: comment.mentions,
    createdAt: comment.createdAt,
    author: shapeAuthor(req.user),
  })
}

module.exports = wrapAll({ listComments, createComment })
