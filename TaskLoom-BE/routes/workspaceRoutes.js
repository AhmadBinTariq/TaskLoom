const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { listWorkspaces, getWorkspace, createWorkspace, renameWorkspace, deleteWorkspace, leaveWorkspace } = require('../controllers/workspaceController')
const { listMembers, updateMemberRole, removeMember } = require('../controllers/memberController')
const { listInvitations, createInvitation, revokeInvitation } = require('../controllers/invitationController')
const { listLabels, createLabel, removeLabel } = require('../controllers/labelController')
const { listProjects, createProject } = require('../controllers/projectController')
const { searchTasks } = require('../controllers/taskController')

router.use(auth)

router.get('/', listWorkspaces)
router.post('/', createWorkspace)
router.get('/:id', getWorkspace)
router.patch('/:id', renameWorkspace)
router.delete('/:id', deleteWorkspace)
router.post('/:id/leave', leaveWorkspace)

router.get('/:id/members', listMembers)
router.patch('/:id/members/:userId', updateMemberRole)
router.delete('/:id/members/:userId', removeMember)

router.get('/:id/invitations', listInvitations)
router.post('/:id/invitations', createInvitation)
router.delete('/:id/invitations/:invId', revokeInvitation)

router.get('/:id/labels', listLabels)
router.post('/:id/labels', createLabel)
router.delete('/:id/labels/:labelId', removeLabel)

router.get('/:id/projects', listProjects)
router.post('/:id/projects', createProject)

router.get('/:id/search', searchTasks)

module.exports = router
