require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const User = require('../models/User')
const Workspace = require('../models/Workspace')
const Membership = require('../models/Membership')
const Invitation = require('../models/Invitation')
const Label = require('../models/Label')
const Project = require('../models/Project')
const Column = require('../models/Column')
const Task = require('../models/Task')
const Comment = require('../models/Comment')
const Activity = require('../models/Activity')

const DAY = 24 * 60 * 60 * 1000

const dateDaysFromNow = (days) => {
  const d = new Date(Date.now() + days * DAY)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI)

  await Promise.all([
    User.deleteMany({}),
    Workspace.deleteMany({}),
    Membership.deleteMany({}),
    Invitation.deleteMany({}),
    Label.deleteMany({}),
    Project.deleteMany({}),
    Column.deleteMany({}),
    Task.deleteMany({}),
    Comment.deleteMany({}),
    Activity.deleteMany({}),
  ])

  const password = await bcrypt.hash('password123', 10)
  const users = {}
  const userData = [
    ['azib', 'Azib Naeem', 'azib@taskloom.dev', 'dark'],
    ['ahmad', 'Ahmad Bin Tariq', 'ahmad@taskloom.dev', 'dark'],
    ['hamza', 'Hamza Ali', 'hamza@taskloom.dev', 'light'],
    ['sara', 'Sara Khan', 'sara@taskloom.dev', 'light'],
    ['bilal', 'Bilal Ahmed', 'bilal@taskloom.dev', 'dark'],
  ]
  for (const [key, name, email, theme] of userData) {
    users[key] = await User.create({ name, email, password, theme })
  }

  const team = await Workspace.create({ name: 'Taskloom Team' })
  const outsider = await Workspace.create({ name: 'Outsider Studio' })

  await Membership.create({ workspace: team._id, user: users.azib._id, role: 'owner' })
  await Membership.create({ workspace: team._id, user: users.ahmad._id, role: 'admin' })
  await Membership.create({ workspace: team._id, user: users.hamza._id, role: 'member' })
  await Membership.create({ workspace: team._id, user: users.sara._id, role: 'viewer' })
  await Membership.create({ workspace: outsider._id, user: users.bilal._id, role: 'owner' })

  const labels = {}
  const labelData = [
    ['frontend', 'Frontend', 'blue', team],
    ['backend', 'Backend', 'violet', team],
    ['bug', 'Bug', 'red', team],
    ['design', 'Design', 'pink', team],
    ['docs', 'Docs', 'teal', team],
    ['marketing', 'Marketing', 'orange', outsider],
  ]
  for (const [key, name, color, ws] of labelData) {
    labels[key] = await Label.create({ workspace: ws._id, name, color })
  }

  const mvp = await Project.create({ workspace: team._id, name: 'Taskloom MVP', description: 'Everything needed for the semester demo.' })
  const report = await Project.create({ workspace: team._id, name: 'Semester Report', description: 'Write-up and presentation.' })
  const secret = await Project.create({ workspace: outsider._id, name: 'Secret Launch', description: 'Not visible to other workspaces.' })

  const columns = {}
  const columnData = [
    ['mvpTodo', mvp, 'To Do', 0],
    ['mvpDoing', mvp, 'In Progress', 1],
    ['mvpReview', mvp, 'Review', 2],
    ['mvpDone', mvp, 'Done', 3],
    ['repTodo', report, 'To Do', 0],
    ['repDoing', report, 'Writing', 1],
    ['repDone', report, 'Done', 2],
    ['secTodo', secret, 'To Do', 0],
    ['secDone', secret, 'Done', 1],
  ]
  for (const [key, project, name, position] of columnData) {
    columns[key] = await Column.create({ project: project._id, name, position })
  }

  let n = 0
  const makeTask = async (project, column, title, opts) => {
    n += 1
    return Task.create({
      workspace: opts.ws ? opts.ws._id : team._id,
      project: project._id,
      column: column._id,
      title,
      description: opts.desc || '',
      assignee: opts.assignee ? opts.assignee._id : null,
      dueDate: opts.due === undefined ? null : dateDaysFromNow(opts.due),
      priority: opts.priority || 'medium',
      labels: (opts.labels || []).map((l) => l._id),
      position: n * 1000,
      createdBy: (opts.by || users.azib)._id,
    })
  }

  const t4 = await (async () => {
    await makeTask(mvp, columns.mvpTodo, 'Design the login and register screens', { assignee: users.azib, due: 2, priority: 'high', labels: [labels.frontend, labels.design] })
    await makeTask(mvp, columns.mvpTodo, 'Add a profile avatar for each member', { assignee: users.ahmad, due: 5, labels: [labels.frontend], by: users.ahmad })
    await makeTask(mvp, columns.mvpTodo, 'Write invitation email template', { priority: 'low', labels: [labels.docs] })
    const task4 = await makeTask(mvp, columns.mvpDoing, 'Build Kanban board with drag and drop', { assignee: users.ahmad, due: 0, priority: 'high', labels: [labels.frontend], desc: 'Columns can be renamed and added. Cards move within and across columns.', by: users.ahmad })
    await makeTask(mvp, columns.mvpDoing, 'Search and combined filters', { assignee: users.hamza, due: 3, labels: [labels.frontend], by: users.hamza })
    await makeTask(mvp, columns.mvpReview, 'Fix dark mode contrast on cards', { assignee: users.azib, due: -1, priority: 'high', labels: [labels.bug, labels.design] })
    await makeTask(mvp, columns.mvpReview, 'Plan the REST API routes', { assignee: users.ahmad, due: -2, labels: [labels.backend, labels.docs], by: users.ahmad })
    await makeTask(mvp, columns.mvpDone, 'Set up Vite + React', { assignee: users.azib, labels: [labels.frontend] })
    await makeTask(mvp, columns.mvpDone, 'Project proposal approved', { priority: 'low', labels: [labels.docs] })
    await makeTask(report, columns.repTodo, 'Collect screenshots of every journey', { assignee: users.hamza, due: 10, priority: 'low', by: users.hamza })
    await makeTask(report, columns.repDoing, 'Write architecture section', { assignee: users.azib, due: 8, labels: [labels.docs] })
    await makeTask(report, columns.repDone, 'Agree on report outline', { priority: 'low' })
    await makeTask(secret, columns.secTodo, 'Confidential launch plan', { ws: outsider, by: users.bilal, assignee: users.bilal, labels: [labels.marketing] })
    await makeTask(secret, columns.secDone, 'Hire designer', { ws: outsider, by: users.bilal })
    return task4
  })()

  await Comment.create({ task: t4._id, author: users.azib._id, body: '@Ahmad Bin Tariq can we use keyboard dragging too?', mentions: [users.ahmad._id] })
  await Comment.create({ task: t4._id, author: users.ahmad._id, body: 'Yes, the library supports it out of the box.', mentions: [] })

  const allTasks = await Task.find({})
  for (const task of allTasks) {
    const column = await Column.findById(task.column)
    await Activity.create({ workspace: task.workspace, project: task.project, task: task._id, actor: task.createdBy, type: 'task.created', data: { title: task.title, column: column ? column.name : '' } })
  }
  await Activity.create({ workspace: team._id, project: mvp._id, task: t4._id, actor: users.ahmad._id, type: 'task.moved', data: { title: t4.title, from: 'To Do', to: 'In Progress' } })

  await Invitation.create({ workspace: team._id, email: 'new.member@taskloom.dev', role: 'member', token: 'demo-valid-invite', invitedBy: users.azib._id, expiresAt: new Date(Date.now() + 1.9 * DAY), status: 'pending' })
  await Invitation.create({ workspace: team._id, email: 'late.person@taskloom.dev', role: 'viewer', token: 'demo-expired-invite', invitedBy: users.ahmad._id, expiresAt: new Date(Date.now() - 1 * DAY), status: 'pending' })

  console.log('Seed complete. Demo accounts use password: password123')
  await mongoose.disconnect()
}

run().catch((error) => {
  console.log('Seed error:', error.message)
  process.exit(1)
})
