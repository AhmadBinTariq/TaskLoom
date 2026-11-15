const mongoose = require('mongoose')

const projectSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
    name: { type: String, required: true, minLength: 2, maxLength: 60 },
    description: { type: String, default: '', maxLength: 500 },
  },
  { timestamps: true },
)

module.exports = mongoose.model('Project', projectSchema)
