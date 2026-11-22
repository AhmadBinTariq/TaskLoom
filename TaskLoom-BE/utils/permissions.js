// Role-based access control: the single source of truth for what each workspace role may do.
//
//   owner  – full control, including deleting the workspace
//   admin  – manages projects, columns, labels, invitations, Members and Viewers
//   member – creates, edits and moves tasks; deletes tasks they created; comments
//   viewer – read-only
//
// Routes declare the permission they need (see middleware/rbac.js), so access rules
// live here and in the route files, not scattered through the controllers.

const ROLES = ['owner', 'admin', 'member', 'viewer']

const EVERYONE = ROLES
const MANAGERS = ['owner', 'admin']
const EDITORS = ['owner', 'admin', 'member']

const matrix = {
  'workspace:read': EVERYONE,
  'workspace:rename': MANAGERS,
  'workspace:delete': ['owner'],
  'workspace:leave': ['admin', 'member', 'viewer'],

  'member:read': EVERYONE,
  'member:manage': MANAGERS,
  'invitation:manage': MANAGERS,

  'label:read': EVERYONE,
  'label:manage': MANAGERS,

  'project:read': EVERYONE,
  'project:manage': MANAGERS,
  'column:manage': MANAGERS,

  'task:read': EVERYONE,
  'task:write': EDITORS,
  'task:delete-any': MANAGERS,
  'task:delete-own': ['member'],

  'comment:read': EVERYONE,
  'comment:create': EDITORS,

  'activity:read': EVERYONE,
}

// Friendlier 403 messages for the actions people hit most often.
const deniedMessages = {
  'workspace:rename': 'Only Owners and Admins can rename the workspace.',
  'workspace:delete': 'Only the owner can delete this workspace.',
  'workspace:leave': 'The owner cannot leave. Delete the workspace instead.',
  'member:manage': 'Only Owners and Admins can manage members.',
  'invitation:manage': 'Only Owners and Admins can manage invitations.',
  'label:manage': 'Only Owners and Admins can manage labels.',
  'project:manage': 'Only Owners and Admins can manage projects.',
  'column:manage': 'Only Owners and Admins can manage columns.',
  'task:write': 'Viewers have read-only access and cannot change tasks.',
  'task:delete-any': 'You can only delete tasks you created.',
  'comment:create': 'Viewers have read-only access and cannot comment.',
}

const can = (role, action) => {
  if (!matrix[action]) throw new Error(`Unknown permission "${action}"`)
  return Boolean(role) && matrix[action].includes(role)
}

const permissionsFor = (role) => Object.keys(matrix).filter((action) => can(role, action))

const deniedMessage = (action) => deniedMessages[action] || 'Your role does not allow this action.'

// Admins and Owners may delete any task; Members only the ones they created.
const canDeleteTask = (role, userId, createdBy) => {
  if (can(role, 'task:delete-any')) return true
  return can(role, 'task:delete-own') && String(userId) === String(createdBy)
}

// Owners manage everyone except other owners; Admins manage Members and Viewers.
const canManageMember = (actorRole, targetRole) => {
  if (actorRole === 'owner') return targetRole !== 'owner'
  if (actorRole === 'admin') return targetRole === 'member' || targetRole === 'viewer'
  return false
}

// Roles an actor may hand out (when inviting or changing someone's role).
const assignableRoles = (actorRole) => {
  if (actorRole === 'owner') return ['admin', 'member', 'viewer']
  if (actorRole === 'admin') return ['member', 'viewer']
  return []
}

module.exports = { ROLES, matrix, can, permissionsFor, deniedMessage, canDeleteTask, canManageMember, assignableRoles }
