const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')

const genToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' })

const shape = (user) => ({ id: user._id, name: user.name, email: user.email, theme: user.theme })

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' })
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' })
    }
    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) {
      return res.status(400).json({ message: 'An account with this email already exists.' })
    }
    const hashed = await bcrypt.hash(password, 10)
    const user = await User.create({ name, email: email.toLowerCase(), password: hashed })
    res.status(201).json({ token: genToken(user._id), user: shape(user) })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email: (email || '').toLowerCase() }).select('+password')
    if (!user) {
      return res.status(401).json({ message: 'Incorrect email or password.' })
    }
    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      return res.status(401).json({ message: 'Incorrect email or password.' })
    }
    res.json({ token: genToken(user._id), user: shape(user) })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { register, login }
