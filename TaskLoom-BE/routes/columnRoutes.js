const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { renameColumn, deleteColumn } = require('../controllers/columnController')

router.use(auth)

router.patch('/:id', renameColumn)
router.delete('/:id', deleteColumn)

module.exports = router
