const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, minLength: 2, maxLength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, match: /.+\@.+\..+/ },
    password: { type: String, required: true, minLength: 8, select: false },
    theme: { type: String, enum: ['light', 'dark'], default: 'light' },
  },
  { timestamps: true },
)

module.exports = mongoose.model('User', userSchema)
