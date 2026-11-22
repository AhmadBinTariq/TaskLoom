const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { wrapAll } = require('../utils/asyncHandler')
const { badRequest, unauthorized, conflict } = require('../utils/ApiError')
const { requireText, requireEmail, requireOneOf } = require('../utils/validate')

const genToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' })

const shape = (user) => ({ id: user._id, name: user.name, email: user.email, theme: user.theme })

const checkPassword = (password) => {
  if (typeof password !== 'string' || password.length < 8) throw badRequest('Password must be at least 8 characters.')
  // bcrypt only uses the first 72 bytes; also stops huge inputs from tying up the CPU.
  if (password.length > 72) throw badRequest('Password must be at most 72 characters.')
  return password
}

const register = async (req, res) => {
  const { name, email, password } = req.body
  if (!name || !email || !password) throw badRequest('Name, email and password are required.')
  const cleanName = requireText(name, 'Name', { min: 2, max: 60 })
  const cleanEmail = requireEmail(email)
  checkPassword(password)

  if (await User.exists({ email: cleanEmail })) throw conflict('An account with this email already exists.')
  const user = await User.create({ name: cleanName, email: cleanEmail, password: await bcrypt.hash(password, 10) })
  res.status(201).json({ token: genToken(user._id), user: shape(user) })
}

const login = async (req, res) => {
  const { email, password } = req.body
  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    throw badRequest('Email and password are required.')
  }
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password')
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw unauthorized('Incorrect email or password.')
  }
  res.json({ token: genToken(user._id), user: shape(user) })
}

const me = async (req, res) => {
  res.json(shape(req.user))
}

const updateProfile = async (req, res) => {
  const { name, theme } = req.body
  if (name !== undefined) req.user.name = requireText(name, 'Name', { min: 2, max: 60 })
  if (theme !== undefined) req.user.theme = requireOneOf(theme, ['light', 'dark'], 'Theme')
  await req.user.save()
  res.json(shape(req.user))
}

module.exports = wrapAll({ register, login, me, updateProfile })
