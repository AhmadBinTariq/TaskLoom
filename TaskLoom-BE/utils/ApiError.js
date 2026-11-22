// An error with an HTTP status. Throw it from any controller or middleware and the
// central error handler turns it into `{ message }` with the right status code.
class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

const badRequest = (message) => new ApiError(400, message)
const unauthorized = (message = 'Not authenticated') => new ApiError(401, message)
const forbidden = (message) => new ApiError(403, message)
const notFound = (message) => new ApiError(404, message)
const conflict = (message) => new ApiError(409, message)

module.exports = { ApiError, badRequest, unauthorized, forbidden, notFound, conflict }
