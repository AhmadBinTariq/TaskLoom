const mongoose = require('mongoose')

const activitySchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    data: { type: Object, default: {} },
  },
  { timestamps: true },
)

module.exports = mongoose.model('Activity', activitySchema)
