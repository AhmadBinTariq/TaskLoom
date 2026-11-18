const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { listWorkspaces, getWorkspace, createWorkspace, renameWorkspace, deleteWorkspace, leaveWorkspace } = require('../controllers/workspaceController')
const { listMembers, updateMemberRole, removeMember } = require('../controllers/memberController')
const { listLabels, createLabel, removeLabel } = require('../controllers/labelController')

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

router.get('/:id/labels', listLabels)
router.post('/:id/labels', createLabel)
router.delete('/:id/labels/:labelId', removeLabel)

module.exports = router
