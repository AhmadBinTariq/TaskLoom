const Label = require('../models/Label')
const Task = require('../models/Task')
const Membership = require('../models/Membership')
const { can } = require('../utils/permissions')

const listLabels = async (req, res) => {
  try {
    const mine = await Membership.findOne({ workspace: req.params.id, user: req.user._id })
    if (!mine) {
      return res.status(403).json({ message: 'You are not a member of this workspace.' })
    }
    const labels = await Label.find({ workspace: req.params.id }).sort({ name: 1 })
    res.json(labels)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const createLabel = async (req, res) => {
  try {
    const { name, color } = req.body
    const mine = await Membership.findOne({ workspace: req.params.id, user: req.user._id })
    if (!mine || !can(mine.role, 'project:manage')) {
      return res.status(403).json({ message: 'You cannot add labels.' })
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Label name is required.' })
    }
    const duplicate = await Label.findOne({ workspace: req.params.id, name: new RegExp(`^${name.trim()}$`, 'i') })
    if (duplicate) {
      return res.status(400).json({ message: 'A label with this name already exists.' })
    }
    const label = await Label.create({ workspace: req.params.id, name: name.trim(), color })
    res.status(201).json(label)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const removeLabel = async (req, res) => {
  try {
    const mine = await Membership.findOne({ workspace: req.params.id, user: req.user._id })
    if (!mine || !can(mine.role, 'project:manage')) {
      return res.status(403).json({ message: 'You cannot remove labels.' })
    }
    await Label.findByIdAndDelete(req.params.labelId)
    await Task.updateMany({ workspace: req.params.id }, { $pull: { labels: req.params.labelId } })
    res.json({ message: 'Label removed.' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { listLabels, createLabel, removeLabel }
