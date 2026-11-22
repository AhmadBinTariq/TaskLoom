const crypto = require('crypto')
const Invitation = require('../models/Invitation')
const Membership = require('../models/Membership')
const User = require('../models/User')
const Workspace = require('../models/Workspace')
const { wrapAll } = require('../utils/asyncHandler')
const { forbidden, notFound, conflict, badRequest } = require('../utils/ApiError')
const { requireId, requireEmail } = require('../utils/validate')
const { assignableRoles, permissionsFor } = require('../utils/permissions')

const INVITE_HOURS = 48

const isExpired = (invitation) => new Date(invitation.expiresAt).getTime() < Date.now()

// Routes for list/create/revoke require 'invitation:manage'.
const listInvitations = async (req, res) => {
  const invitations = await Invitation.find({ workspace: req.workspaceId, status: 'pending' }).populate('invitedBy')
  const result = invitations
    .map((i) => ({
      id: i._id,
      email: i.email,
      role: i.role,
      token: i.token,
      invitedByName: i.invitedBy ? i.invitedBy.name : '',
      expiresAt: i.expiresAt,
      expired: isExpired(i),
    }))
    .sort((a, b) => new Date(b.expiresAt) - new Date(a.expiresAt))
  res.json(result)
}

const createInvitation = async (req, res) => {
  const email = requireEmail(req.body.email)
  const { role } = req.body
  if (!assignableRoles(req.role).includes(role)) {
    throw forbidden(`As ${req.role === 'admin' ? 'an Admin' : 'a ' + req.role} you can invite: ${assignableRoles(req.role).join(', ')}.`)
  }

  const existingUser = await User.findOne({ email })
  if (existingUser && (await Membership.exists({ workspace: req.workspaceId, user: existingUser._id }))) {
    throw conflict('This person is already a member.')
  }

  // Only one live invitation per email: older pending ones are revoked.
  await Invitation.updateMany({ workspace: req.workspaceId, email, status: 'pending' }, { status: 'revoked' })
  const invitation = await Invitation.create({
    workspace: req.workspaceId,
    email,
    role,
    token: crypto.randomBytes(24).toString('hex'),
    invitedBy: req.user._id,
    expiresAt: new Date(Date.now() + INVITE_HOURS * 60 * 60 * 1000),
  })
  res.status(201).json({ id: invitation._id, email, role, token: invitation.token, expiresAt: invitation.expiresAt })
}

const revokeInvitation = async (req, res) => {
  const invId = requireId(req.params.invId, 'invitation id')
  // Scoped to this workspace so managers cannot touch other workspaces' invitations.
  const invitation = await Invitation.findOneAndUpdate(
    { _id: invId, workspace: req.workspaceId, status: 'pending' },
    { status: 'revoked' },
  )
  if (!invitation) throw notFound('Invitation not found.')
  res.json({ message: 'Invitation revoked.' })
}

// Public: anyone with the link can see what they are being invited to.
const previewInvitation = async (req, res) => {
  const invitation = await Invitation.findOne({ token: String(req.params.token) }).populate('invitedBy').populate('workspace')
  if (!invitation) throw notFound('This invitation link is invalid.')
  res.json({
    workspaceId: invitation.workspace ? invitation.workspace._id : null,
    workspaceName: invitation.workspace ? invitation.workspace.name : 'Unknown workspace',
    email: invitation.email,
    role: invitation.role,
    invitedByName: invitation.invitedBy ? invitation.invitedBy.name : '',
    expiresAt: invitation.expiresAt,
    status: invitation.status === 'pending' && isExpired(invitation) ? 'expired' : invitation.status,
  })
}

const acceptInvitation = async (req, res) => {
  const invitation = await Invitation.findOne({ token: String(req.params.token) })
  if (!invitation) throw notFound('This invitation link is invalid.')
  if (invitation.status !== 'pending' || isExpired(invitation)) throw conflict('This invitation is no longer valid.')
  if (invitation.email !== req.user.email.toLowerCase()) throw forbidden(`This invitation was sent to ${invitation.email}.`)

  const workspace = await Workspace.findById(invitation.workspace)
  if (!workspace) throw badRequest('This workspace no longer exists.')

  let membership = await Membership.findOne({ workspace: workspace._id, user: req.user._id })
  if (!membership) {
    membership = await Membership.create({ workspace: workspace._id, user: req.user._id, role: invitation.role })
  }
  invitation.status = 'accepted'
  await invitation.save()
  res.json({
    id: workspace._id,
    name: workspace.name,
    createdAt: workspace.createdAt,
    myRole: membership.role,
    permissions: permissionsFor(membership.role),
  })
}

module.exports = wrapAll({ listInvitations, createInvitation, revokeInvitation, previewInvitation, acceptInvitation })
