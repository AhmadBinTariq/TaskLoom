const Activity = require('../models/Activity')
const Task = require('../models/Task')
const Project = require('../models/Project')
const Membership = require('../models/Membership')

const roleOf = async (workspaceId, userId) => {
  const m = await Membership.findOne({ workspace: workspaceId, user: userId })
  return m ? m.role : null
}

const listActivity = async (req, res) => {
  try {
    const { projectId, taskId } = req.query
    let filter
    let workspaceId
    if (taskId) {
      const task = await Task.findById(taskId)
      if (!task) {
        return res.status(404).json({ message: 'Task not found.' })
      }
      workspaceId = task.workspace
      filter = { task: taskId }
    } else if (projectId) {
      const project = await Project.findById(projectId)
      if (!project) {
        return res.status(404).json({ message: 'Project not found.' })
      }
      workspaceId = project.workspace
      filter = { project: projectId }
    } else {
      return res.status(400).json({ message: 'A project or task is required.' })
    }
    const role = await roleOf(workspaceId, req.user._id)
    if (!role) {
      return res.status(403).json({ message: 'You are not a member of this workspace.' })
    }
    const rows = await Activity.find(filter).populate('actor').sort({ createdAt: -1 }).limit(100)
    const result = rows.map((a) => ({
      id: a._id,
      type: a.type,
      data: a.data,
      createdAt: a.createdAt,
      actor: a.actor ? { id: a.actor._id, name: a.actor.name, email: a.actor.email } : null,
    }))
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { listActivity }
