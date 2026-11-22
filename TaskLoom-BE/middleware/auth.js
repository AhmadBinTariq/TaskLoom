const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { asyncHandler } = require('../utils/asyncHandler')
const { unauthorized } = require('../utils/ApiError')

// Verifies the `Authorization: Bearer <token>` header and puts the user on req.user.
const auth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || ''
  if (!header.startsWith('Bearer ')) throw unauthorized()

  let decoded
  try {
    decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET)
  } catch (error) {
    if (error.name === 'TokenExpiredError') throw unauthorized('Your session has expired. Please sign in again.')
    throw unauthorized()
  }

  const user = await User.findById(decoded.id)
  if (!user) throw unauthorized()
  req.user = user
  next()
})

module.exports = auth
