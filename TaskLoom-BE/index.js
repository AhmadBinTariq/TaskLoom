require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')

const authRoutes = require('./routes/authRoutes')
const workspaceRoutes = require('./routes/workspaceRoutes')
const invitationRoutes = require('./routes/invitationRoutes')
const projectRoutes = require('./routes/projectRoutes')
const columnRoutes = require('./routes/columnRoutes')

const app = express()

app.use(express.json())

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err.message))

app.get('/', (req, res) => {
  res.send('TaskLoom API is running')
})

app.use('/api/auth', authRoutes)
app.use('/api/workspaces', workspaceRoutes)
app.use('/api/invitations', invitationRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/columns', columnRoutes)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
