const Label = require('../models/Label')
const Task = require('../models/Task')
const { wrapAll } = require('../utils/asyncHandler')
const { conflict, notFound } = require('../utils/ApiError')
const { requireId, requireText, requireOneOf, escapeRegex } = require('../utils/validate')

const COLORS = ['red', 'orange', 'yellow', 'green', 'teal', 'blue', 'violet', 'pink']

const listLabels = async (req, res) => {
  const labels = await Label.find({ workspace: req.workspaceId }).sort({ name: 1 })
  res.json(labels)
}

const createLabel = async (req, res) => {
  const name = requireText(req.body.name, 'Label name', { max: 24 })
  const color = req.body.color === undefined ? 'blue' : requireOneOf(req.body.color, COLORS, 'Colour')
  const duplicate = await Label.exists({ workspace: req.workspaceId, name: new RegExp(`^${escapeRegex(name)}$`, 'i') })
  if (duplicate) throw conflict('A label with this name already exists.')
  const label = await Label.create({ workspace: req.workspaceId, name, color })
  res.status(201).json(label)
}

const removeLabel = async (req, res) => {
  const labelId = requireId(req.params.labelId, 'label id')
  // Scoped to this workspace so managers cannot delete another workspace's labels.
  const label = await Label.findOneAndDelete({ _id: labelId, workspace: req.workspaceId })
  if (!label) throw notFound('Label not found.')
  await Task.updateMany({ workspace: req.workspaceId }, { $pull: { labels: label._id } })
  res.json({ message: 'Label removed.' })
}

module.exports = wrapAll({ listLabels, createLabel, removeLabel })
