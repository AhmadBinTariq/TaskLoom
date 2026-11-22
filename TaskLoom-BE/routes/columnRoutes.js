const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { access } = require('../middleware/rbac')
const { renameColumn, deleteColumn } = require('../controllers/columnController')

router.use(auth)

router.patch('/:id', access('column', 'column:manage'), renameColumn)
router.delete('/:id', access('column', 'column:manage'), deleteColumn)

module.exports = router
