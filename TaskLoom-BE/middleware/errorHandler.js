const { ApiError } = require('../utils/ApiError')

const notFoundRoute = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` })
}

// Central error handler: every thrown/forwarded error ends up here and is returned as
// `{ message }`. Unexpected errors are logged but never leaked to the client.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ message: err.message })
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Request body must be valid JSON.' })
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body is too large.' })
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ message: `Invalid ${err.path}.` })
  }
  if (err.name === 'ValidationError') {
    const first = Object.values(err.errors)[0]
    return res.status(400).json({ message: first ? first.message : 'Invalid data.' })
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: 'That value is already in use.' })
  }

  console.error(err)
  res.status(500).json({ message: 'Something went wrong on the server. Please try again.' })
}

module.exports = { notFoundRoute, errorHandler }
