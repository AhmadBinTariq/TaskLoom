const Membership = require('../models/Membership')
const Task = require('../models/Task')
const { wrapAll } = require('../utils/asyncHandler')
const { badRequest, forbidden, notFound } = require('../utils/ApiError')
const { requireId, requireOneOf } = require('../utils/validate')
const { ROLES, canManageMember, assignableRoles } = require('../utils/permissions')

const findTarget = async (req) => {
  const userId = requireId(req.params.userId, 'user id')
  const target = await Membership.findOne({ workspace: req.workspaceId, user: userId })
  if (!target) throw notFound('Member not found.')
  return target
}

const listMembers = async (req, res) => {
  const memberships = await Membership.find({ workspace: req.workspaceId }).populate('user')
  const members = memberships
    .filter((m) => m.user)
    .map((m) => ({
      user: { id: m.user._id, name: m.user.name, email: m.user.email },
      role: m.role,
      joinedAt: m.joinedAt,
    }))
    .sort((a, b) => ROLES.indexOf(a.role) - ROLES.indexOf(b.role) || a.user.name.localeCompare(b.user.name))
  res.json(members)
}

// Route requires 'member:manage'; here we apply the role hierarchy on top of it.
const updateMemberRole = async (req, res) => {
  const role = requireOneOf(req.body.role, ROLES, 'Role')
  const target = await findTarget(req)
  if (String(target.user) === String(req.user._id)) throw forbidden('You cannot change your own role.')
  if (!canManageMember(req.role, target.role)) throw forbidden(`You cannot change the role of a ${target.role}.`)
  if (!assignableRoles(req.role).includes(role)) throw forbidden(`You cannot make someone a ${role}.`)
  target.role = role
  await target.save()
  res.json({ message: 'Role updated.', role })
}

const removeMember = async (req, res) => {
  const target = await findTarget(req)
  if (String(target.user) === String(req.user._id)) throw badRequest('Use leave workspace to remove yourself.')
  if (!canManageMember(req.role, target.role)) throw forbidden(`You cannot remove a ${target.role}.`)
  await Membership.deleteOne({ _id: target._id })
  await Task.updateMany({ workspace: req.workspaceId, assignee: target.user }, { assignee: null })
  res.json({ message: 'Member removed.' })
}

module.exports = wrapAll({ listMembers, updateMemberRole, removeMember })
