const mongoose = require('mongoose')

const columnSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    name: { type: String, required: true, maxLength: 30 },
    position: { type: Number, default: 0 },
  },
  { timestamps: true },
)

module.exports = mongoose.model('Column', columnSchema)
