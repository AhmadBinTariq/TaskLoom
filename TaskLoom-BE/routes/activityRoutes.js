const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { listActivity } = require('../controllers/activityController')

router.use(auth)

router.get('/', listActivity)

module.exports = router
