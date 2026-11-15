const mongoose = require('mongoose')

const taskSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    column: { type: mongoose.Schema.Types.ObjectId, ref: 'Column', required: true },
    title: { type: String, required: true, maxLength: 120 },
    description: { type: String, default: '', maxLength: 5000 },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    dueDate: { type: String, default: null },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    labels: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Label' }],
    position: { type: Number, default: 1000 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
)

module.exports = mongoose.model('Task', taskSchema)
