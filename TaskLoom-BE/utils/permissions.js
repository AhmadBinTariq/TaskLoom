const matrix = {
  'task:write': ['owner', 'admin', 'member'],
  'task:delete-any': ['owner', 'admin'],
  'comment:create': ['owner', 'admin', 'member'],
  'project:manage': ['owner', 'admin'],
  'member:manage': ['owner', 'admin'],
  'workspace:rename': ['owner', 'admin'],
  'workspace:delete': ['owner'],
}

const can = (role, action) => {
  if (!role) return false
  return matrix[action].includes(role)
}

const canDeleteTask = (role, userId, createdBy) => {
  if (can(role, 'task:delete-any')) return true
  return role === 'member' && String(userId) === String(createdBy)
}

const canManageMember = (actorRole, targetRole) => {
  if (actorRole === 'owner') return targetRole !== 'owner'
  if (actorRole === 'admin') return targetRole === 'member' || targetRole === 'viewer'
  return false
}

const assignableRoles = (actorRole) => {
  if (actorRole === 'owner') return ['admin', 'member', 'viewer']
  if (actorRole === 'admin') return ['member', 'viewer']
  return []
}

module.exports = { can, canDeleteTask, canManageMember, assignableRoles }
