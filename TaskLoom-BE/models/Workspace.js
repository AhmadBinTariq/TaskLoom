const mongoose = require('mongoose')

const workspaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, minLength: 2, maxLength: 50 },
  },
  { timestamps: true },
)

module.exports = mongoose.model('Workspace', workspaceSchema)
