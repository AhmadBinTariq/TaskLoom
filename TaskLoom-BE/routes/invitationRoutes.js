const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { previewInvitation, acceptInvitation } = require('../controllers/invitationController')

router.get('/:token', previewInvitation)
router.post('/:token/accept', auth, acceptInvitation)

module.exports = router
