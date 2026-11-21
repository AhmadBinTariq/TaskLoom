const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { getTask, updateTask, moveTask, deleteTask } = require('../controllers/taskController')
const { listComments, createComment } = require('../controllers/commentController')

router.use(auth)

router.get('/:id', getTask)
router.patch('/:id', updateTask)
router.delete('/:id', deleteTask)
router.patch('/:id/move', moveTask)
router.get('/:id/comments', listComments)
router.post('/:id/comments', createComment)

module.exports = router
