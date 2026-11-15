const mongoose = require('mongoose')

const invitationSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
    email: { type: String, required: true, lowercase: true },
    role: { type: String, enum: ['admin', 'member', 'viewer'], default: 'member' },
    token: { type: String, required: true, unique: true },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true },
    status: { type: String, enum: ['pending', 'accepted', 'revoked'], default: 'pending' },
  },
  { timestamps: true },
)

module.exports = mongoose.model('Invitation', invitationSchema)
