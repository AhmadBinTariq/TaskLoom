const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { getBoard, updateProject, deleteProject } = require('../controllers/projectController')
const { createColumn } = require('../controllers/columnController')

router.use(auth)

router.get('/:id/board', getBoard)
router.patch('/:id', updateProject)
router.delete('/:id', deleteProject)
router.post('/:id/columns', createColumn)

module.exports = router
