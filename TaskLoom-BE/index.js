require('dotenv').config()
const express = require('express')
const cors = require('cors')
const connectDB = require('./config/db')
const { notFoundRoute, errorHandler } = require('./middleware/errorHandler')

const authRoutes = require('./routes/authRoutes')
const workspaceRoutes = require('./routes/workspaceRoutes')
const invitationRoutes = require('./routes/invitationRoutes')
const projectRoutes = require('./routes/projectRoutes')
const columnRoutes = require('./routes/columnRoutes')
const taskRoutes = require('./routes/taskRoutes')
const activityRoutes = require('./routes/activityRoutes')

for (const key of ['MONGO_URI', 'JWT_SECRET']) {
  if (!process.env[key]) {
    console.error(`Missing ${key}. Add it to TaskLoom-BE/.env (see README).`)
    process.exit(1)
  }
}

// Browsers may only call the API from these origins (comma-separated in CLIENT_URL).
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const app = express()

app.disable('x-powered-by')
app.use(cors({ origin: allowedOrigins }))
app.use(express.json({ limit: '100kb' }))

app.get('/', (req, res) => {
  res.send('TaskLoom API is running')
})

app.use('/api/auth', authRoutes)
app.use('/api/workspaces', workspaceRoutes)
app.use('/api/invitations', invitationRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/columns', columnRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/activity', activityRoutes)

app.use(notFoundRoute)
app.use(errorHandler)

const PORT = process.env.PORT || 5000

// Only start accepting requests once the database is reachable.
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
})
