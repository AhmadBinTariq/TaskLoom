const { badRequest } = require('./ApiError')

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const isId = (value) => typeof value === 'string' && /^[a-f0-9]{24}$/i.test(value)

// Throws 400 unless `value` is a valid MongoDB ObjectId string.
const requireId = (value, label = 'id') => {
  if (!isId(value)) throw badRequest(`Invalid ${label}.`)
  return value
}

// Trims a string field and checks its length. Throws 400 with a readable message.
const requireText = (value, label, { min = 1, max } = {}) => {
  const text = typeof value === 'string' ? value.trim() : ''
  if (text.length < min) {
    throw badRequest(min <= 1 ? `${label} is required.` : `${label} must be at least ${min} characters.`)
  }
  if (max && text.length > max) throw badRequest(`${label} must be at most ${max} characters.`)
  return text
}

const optionalText = (value, label, { max } = {}) => {
  if (value === undefined || value === null) return ''
  if (typeof value !== 'string') throw badRequest(`${label} must be text.`)
  const text = value.trim()
  if (max && text.length > max) throw badRequest(`${label} must be at most ${max} characters.`)
  return text
}

const requireEmail = (value) => {
  const email = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (!EMAIL_RE.test(email)) throw badRequest('Enter a valid email address.')
  return email
}

const requireOneOf = (value, allowed, label) => {
  if (!allowed.includes(value)) throw badRequest(`${label} must be one of: ${allowed.join(', ')}.`)
  return value
}

// Accepts null/'' (no due date) or a real calendar date in YYYY-MM-DD form.
const optionalDate = (value) => {
  if (value === null || value === undefined || value === '') return null
  if (typeof value !== 'string' || !DATE_RE.test(value) || Number.isNaN(Date.parse(value))) {
    throw badRequest('Due date must be a date in YYYY-MM-DD format.')
  }
  return value
}

// Makes user text safe to embed in a RegExp.
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

module.exports = { isId, requireId, requireText, optionalText, requireEmail, requireOneOf, optionalDate, escapeRegex }
