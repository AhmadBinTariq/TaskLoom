const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { access } = require('../middleware/rbac')
const { getTask, updateTask, moveTask, deleteTask } = require('../controllers/taskController')
const { listComments, createComment } = require('../controllers/commentController')

// Every route checks the caller's role in the workspace that owns task :id.
const task = (...permissions) => access('task', ...permissions)

router.use(auth)

router.get('/:id', task('task:read'), getTask)
router.patch('/:id', task('task:write'), updateTask)
router.delete('/:id', task('task:delete-any', 'task:delete-own'), deleteTask)
router.patch('/:id/move', task('task:write'), moveTask)
router.get('/:id/comments', task('comment:read'), listComments)
router.post('/:id/comments', task('comment:create'), createComment)

module.exports = router
