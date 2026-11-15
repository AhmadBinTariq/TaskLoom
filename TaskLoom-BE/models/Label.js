const mongoose = require('mongoose')

const labelSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
    name: { type: String, required: true, maxLength: 24 },
    color: { type: String, enum: ['red', 'orange', 'yellow', 'green', 'teal', 'blue', 'violet', 'pink'], default: 'blue' },
  },
  { timestamps: true },
)

module.exports = mongoose.model('Label', labelSchema)
