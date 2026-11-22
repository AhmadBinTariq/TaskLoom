const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { access } = require('../middleware/rbac')
const { listWorkspaces, getWorkspace, createWorkspace, renameWorkspace, deleteWorkspace, leaveWorkspace } = require('../controllers/workspaceController')
const { listMembers, updateMemberRole, removeMember } = require('../controllers/memberController')
const { listInvitations, createInvitation, revokeInvitation } = require('../controllers/invitationController')
const { listLabels, createLabel, removeLabel } = require('../controllers/labelController')
const { listProjects, createProject } = require('../controllers/projectController')
const { searchTasks } = require('../controllers/taskController')

// Every /:id route checks the caller's role in workspace :id.
const ws = (...permissions) => access('workspace', ...permissions)

router.use(auth)

router.get('/', listWorkspaces)
router.post('/', createWorkspace)
router.get('/:id', ws('workspace:read'), getWorkspace)
router.patch('/:id', ws('workspace:rename'), renameWorkspace)
router.delete('/:id', ws('workspace:delete'), deleteWorkspace)
router.post('/:id/leave', ws('workspace:leave'), leaveWorkspace)

router.get('/:id/members', ws('member:read'), listMembers)
router.patch('/:id/members/:userId', ws('member:manage'), updateMemberRole)
router.delete('/:id/members/:userId', ws('member:manage'), removeMember)

router.get('/:id/invitations', ws('invitation:manage'), listInvitations)
router.post('/:id/invitations', ws('invitation:manage'), createInvitation)
router.delete('/:id/invitations/:invId', ws('invitation:manage'), revokeInvitation)

router.get('/:id/labels', ws('label:read'), listLabels)
router.post('/:id/labels', ws('label:manage'), createLabel)
router.delete('/:id/labels/:labelId', ws('label:manage'), removeLabel)

router.get('/:id/projects', ws('project:read'), listProjects)
router.post('/:id/projects', ws('project:manage'), createProject)

router.get('/:id/search', ws('task:read'), searchTasks)

module.exports = router
