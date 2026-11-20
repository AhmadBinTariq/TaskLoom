const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { getTask, updateTask, moveTask, deleteTask } = require('../controllers/taskController')

router.use(auth)

router.get('/:id', getTask)
router.patch('/:id', updateTask)
router.delete('/:id', deleteTask)
router.patch('/:id/move', moveTask)

module.exports = router
