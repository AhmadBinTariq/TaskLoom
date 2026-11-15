const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { listWorkspaces, getWorkspace, createWorkspace, renameWorkspace, deleteWorkspace, leaveWorkspace } = require('../controllers/workspaceController')

router.use(auth)

router.get('/', listWorkspaces)
router.post('/', createWorkspace)
router.get('/:id', getWorkspace)
router.patch('/:id', renameWorkspace)
router.delete('/:id', deleteWorkspace)
router.post('/:id/leave', leaveWorkspace)

module.exports = router
