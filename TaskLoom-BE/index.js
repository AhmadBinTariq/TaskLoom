require('dotenv').config()
const express = require('express')
const cors = require('cors')
const connectDB = require('./config/db')

const authRoutes = require('./routes/authRoutes')
const workspaceRoutes = require('./routes/workspaceRoutes')
const invitationRoutes = require('./routes/invitationRoutes')
const projectRoutes = require('./routes/projectRoutes')
const columnRoutes = require('./routes/columnRoutes')
const taskRoutes = require('./routes/taskRoutes')
const activityRoutes = require('./routes/activityRoutes')

const app = express()

app.use(cors())
app.use(express.json())

connectDB()

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

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
