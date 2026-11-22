const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { access } = require('../middleware/rbac')
const { listActivity } = require('../controllers/activityController')

router.use(auth)

router.get('/', access('activity', 'activity:read'), listActivity)

module.exports = router
