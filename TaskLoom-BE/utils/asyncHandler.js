// Express 4 does not catch errors thrown inside async functions.
// Wrapping a handler forwards any rejection to the central error handler.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

// Wraps every function in a controller's export object.
const wrapAll = (handlers) =>
  Object.fromEntries(Object.entries(handlers).map(([name, fn]) => [name, asyncHandler(fn)]))

module.exports = { asyncHandler, wrapAll }
