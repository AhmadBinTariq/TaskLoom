const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { access } = require('../middleware/rbac')
const { getBoard, updateProject, deleteProject } = require('../controllers/projectController')
const { createColumn } = require('../controllers/columnController')
const { createTask } = require('../controllers/taskController')

// Every route checks the caller's role in the workspace that owns project :id.
const project = (...permissions) => access('project', ...permissions)

router.use(auth)

router.get('/:id/board', project('project:read'), getBoard)
router.patch('/:id', project('project:manage'), updateProject)
router.delete('/:id', project('project:manage'), deleteProject)
router.post('/:id/columns', project('column:manage'), createColumn)
router.post('/:id/tasks', project('task:write'), createTask)

module.exports = router
