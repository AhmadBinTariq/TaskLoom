const Membership = require('../models/Membership')
const Task = require('../models/Task')
const { canManageMember, assignableRoles } = require('../utils/permissions')

const ROLE_ORDER = ['owner', 'admin', 'member', 'viewer']

const listMembers = async (req, res) => {
  try {
    const mine = await Membership.findOne({ workspace: req.params.id, user: req.user._id })
    if (!mine) {
      return res.status(403).json({ message: 'You are not a member of this workspace.' })
    }
    const memberships = await Membership.find({ workspace: req.params.id }).populate('user')
    const members = memberships
      .filter((m) => m.user)
      .map((m) => ({
        user: { id: m.user._id, name: m.user.name, email: m.user.email },
        role: m.role,
        joinedAt: m.joinedAt,
      }))
      .sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role) || a.user.name.localeCompare(b.user.name))
    res.json(members)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const updateMemberRole = async (req, res) => {
  try {
    const { role } = req.body
    const mine = await Membership.findOne({ workspace: req.params.id, user: req.user._id })
    const target = await Membership.findOne({ workspace: req.params.id, user: req.params.userId })
    if (!mine || !target) {
      return res.status(404).json({ message: 'Member not found.' })
    }
    if (String(req.params.userId) === String(req.user._id)) {
      return res.status(403).json({ message: 'You cannot change your own role.' })
    }
    if (!canManageMember(mine.role, target.role) || !assignableRoles(mine.role).includes(role)) {
      return res.status(403).json({ message: 'You cannot make this change.' })
    }
    target.role = role
    await target.save()
    res.json({ message: 'Role updated.', role })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const removeMember = async (req, res) => {
  try {
    const mine = await Membership.findOne({ workspace: req.params.id, user: req.user._id })
    const target = await Membership.findOne({ workspace: req.params.id, user: req.params.userId })
    if (!mine || !target) {
      return res.status(404).json({ message: 'Member not found.' })
    }
    if (String(req.params.userId) === String(req.user._id)) {
      return res.status(400).json({ message: 'Use leave workspace to remove yourself.' })
    }
    if (!canManageMember(mine.role, target.role)) {
      return res.status(403).json({ message: 'You cannot remove this member.' })
    }
    await Membership.deleteOne({ _id: target._id })
    await Task.updateMany({ workspace: req.params.id, assignee: req.params.userId }, { assignee: null })
    res.json({ message: 'Member removed.' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { listMembers, updateMemberRole, removeMember }
