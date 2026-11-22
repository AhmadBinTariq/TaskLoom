// Role-based access control middleware.
//
//   router.patch('/:id', access('project', 'project:manage'), updateProject)
//
// 1. Loads the resource named by the route (workspace, project, column, task, or the
//    project/task in an activity query) and works out which workspace it belongs to.
// 2. Loads the caller's membership in that workspace (403 if they are not a member).
// 3. Checks that their role has at least one of the listed permissions (403 if not).
//
// Controllers then get the loaded documents on `req` (req.workspace, req.project,
// req.column, req.task) and the caller's role on `req.role`, so they never repeat
// lookups or permission checks.
const Workspace = require('../models/Workspace')
const Membership = require('../models/Membership')
const Project = require('../models/Project')
const Column = require('../models/Column')
const Task = require('../models/Task')
const { asyncHandler } = require('../utils/asyncHandler')
const { forbidden, notFound, badRequest } = require('../utils/ApiError')
const { requireId } = require('../utils/validate')
const { can, deniedMessage } = require('../utils/permissions')

const findOr404 = async (Model, id, label) => {
  const doc = await Model.findById(requireId(id, `${label.toLowerCase()} id`))
  if (!doc) throw notFound(`${label} not found.`)
  return doc
}

// Each resolver loads the resource and returns the id of the workspace it lives in.
const resolvers = {
  workspace: async (req) => {
    req.workspace = await findOr404(Workspace, req.params.id, 'Workspace')
    return req.workspace._id
  },
  project: async (req) => {
    req.project = await findOr404(Project, req.params.id, 'Project')
    return req.project.workspace
  },
  column: async (req) => {
    req.column = await findOr404(Column, req.params.id, 'Column')
    req.project = await findOr404(Project, String(req.column.project), 'Project')
    return req.project.workspace
  },
  task: async (req) => {
    req.task = await findOr404(Task, req.params.id, 'Task')
    return req.task.workspace
  },
  // GET /api/activity?taskId=... or ?projectId=...
  activity: async (req) => {
    const { taskId, projectId } = req.query
    if (taskId) {
      req.task = await findOr404(Task, taskId, 'Task')
      return req.task.workspace
    }
    if (projectId) {
      req.project = await findOr404(Project, projectId, 'Project')
      return req.project.workspace
    }
    throw badRequest('A projectId or taskId is required.')
  },
}

const access = (resource, ...permissions) => {
  const resolve = resolvers[resource]
  if (!resolve) throw new Error(`Unknown RBAC resource "${resource}"`)
  permissions.forEach((p) => can('owner', p)) // fail fast on typos when routes load

  return asyncHandler(async (req, res, next) => {
    const workspaceId = await resolve(req)
    const membership = await Membership.findOne({ workspace: workspaceId, user: req.user._id })
    if (!membership) throw forbidden('You are not a member of this workspace.')

    if (permissions.length && !permissions.some((p) => can(membership.role, p))) {
      throw forbidden(deniedMessage(permissions[0]))
    }

    req.workspaceId = workspaceId
    req.membership = membership
    req.role = membership.role
    next()
  })
}

module.exports = { access }
