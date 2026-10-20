const matrix = {
  'task:write': ['owner', 'admin', 'member'],
  'task:delete-any': ['owner', 'admin'],
  'comment:create': ['owner', 'admin', 'member'],
  'project:manage': ['owner', 'admin'],
  'member:manage': ['owner', 'admin'],
  'workspace:rename': ['owner', 'admin'],
  'workspace:delete': ['owner'],
}

export function can(role, action) {
  if (!role) return false
  return matrix[action].includes(role)
}

export function canDeleteTask(role, userId, createdBy) {
  if (can(role, 'task:delete-any')) return true
  return role === 'member' && userId === createdBy
}

export function canManageMember(actorRole, targetRole) {
  if (actorRole === 'owner') return targetRole !== 'owner'
  if (actorRole === 'admin') return targetRole === 'member' || targetRole === 'viewer'
  return false
}

export function assignableRoles(actorRole) {
  if (actorRole === 'owner') return ['admin', 'member', 'viewer']
  if (actorRole === 'admin') return ['member', 'viewer']
  return []
}

export const roleLabel = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
}
