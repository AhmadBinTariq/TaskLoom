const crypto = require('crypto')
const Invitation = require('../models/Invitation')
const Membership = require('../models/Membership')
const Workspace = require('../models/Workspace')
const { can, assignableRoles } = require('../utils/permissions')

const INVITE_HOURS = 48

const listInvitations = async (req, res) => {
  try {
    const mine = await Membership.findOne({ workspace: req.params.id, user: req.user._id })
    if (!mine || !can(mine.role, 'member:manage')) {
      return res.status(403).json({ message: 'You cannot view invitations.' })
    }
    const invitations = await Invitation.find({ workspace: req.params.id, status: 'pending' }).populate('invitedBy')
    const result = invitations
      .map((i) => ({
        id: i._id,
        email: i.email,
        role: i.role,
        invitedByName: i.invitedBy ? i.invitedBy.name : '',
        expiresAt: i.expiresAt,
        expired: new Date(i.expiresAt).getTime() < Date.now(),
      }))
      .sort((a, b) => new Date(b.expiresAt) - new Date(a.expiresAt))
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const createInvitation = async (req, res) => {
  try {
    const { email, role } = req.body
    const mine = await Membership.findOne({ workspace: req.params.id, user: req.user._id })
    if (!mine || !can(mine.role, 'member:manage')) {
      return res.status(403).json({ message: 'You cannot invite members.' })
    }
    if (!/.+\@.+\..+/.test(email || '')) {
      return res.status(400).json({ message: 'Enter a valid email address.' })
    }
    if (!assignableRoles(mine.role).includes(role)) {
      return res.status(403).json({ message: 'You cannot invite someone with this role.' })
    }
    await Invitation.updateMany(
      { workspace: req.params.id, email: email.toLowerCase(), status: 'pending' },
      { status: 'revoked' },
    )
    const invitation = await Invitation.create({
      workspace: req.params.id,
      email: email.toLowerCase(),
      role,
      token: crypto.randomUUID().replace(/-/g, ''),
      invitedBy: req.user._id,
      expiresAt: new Date(Date.now() + INVITE_HOURS * 60 * 60 * 1000),
    })
    res.status(201).json(invitation)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const revokeInvitation = async (req, res) => {
  try {
    const mine = await Membership.findOne({ workspace: req.params.id, user: req.user._id })
    if (!mine || !can(mine.role, 'member:manage')) {
      return res.status(403).json({ message: 'You cannot revoke invitations.' })
    }
    await Invitation.findByIdAndUpdate(req.params.invId, { status: 'revoked' })
    res.json({ message: 'Invitation revoked.' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const previewInvitation = async (req, res) => {
  try {
    const invitation = await Invitation.findOne({ token: req.params.token }).populate('invitedBy').populate('workspace')
    if (!invitation) {
      return res.status(404).json({ message: 'This invitation link is invalid.' })
    }
    const expired = invitation.status === 'pending' && new Date(invitation.expiresAt).getTime() < Date.now()
    res.json({
      workspaceId: invitation.workspace ? invitation.workspace._id : null,
      workspaceName: invitation.workspace ? invitation.workspace.name : 'Unknown workspace',
      email: invitation.email,
      role: invitation.role,
      invitedByName: invitation.invitedBy ? invitation.invitedBy.name : '',
      expiresAt: invitation.expiresAt,
      status: expired ? 'expired' : invitation.status,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const acceptInvitation = async (req, res) => {
  try {
    const invitation = await Invitation.findOne({ token: req.params.token })
    if (!invitation) {
      return res.status(404).json({ message: 'This invitation link is invalid.' })
    }
    const expired = new Date(invitation.expiresAt).getTime() < Date.now()
    if (invitation.status !== 'pending' || expired) {
      return res.status(409).json({ message: 'This invitation is no longer valid.' })
    }
    if (invitation.email !== req.user.email.toLowerCase()) {
      return res.status(403).json({ message: `This invitation was sent to ${invitation.email}.` })
    }
    const existing = await Membership.findOne({ workspace: invitation.workspace, user: req.user._id })
    if (!existing) {
      await Membership.create({ workspace: invitation.workspace, user: req.user._id, role: invitation.role })
    }
    invitation.status = 'accepted'
    await invitation.save()
    const workspace = await Workspace.findById(invitation.workspace)
    res.json({ id: workspace._id, name: workspace.name, createdAt: workspace.createdAt, myRole: invitation.role })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { listInvitations, createInvitation, revokeInvitation, previewInvitation, acceptInvitation }
