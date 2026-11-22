const Activity = require('../models/Activity')
const { wrapAll } = require('../utils/asyncHandler')

// GET /api/activity?taskId=... or ?projectId=...
// access('activity', 'activity:read') loaded req.task or req.project and checked membership.
const listActivity = async (req, res) => {
  const filter = req.task ? { task: req.task._id } : { project: req.project._id }
  const rows = await Activity.find(filter).populate('actor').sort({ createdAt: -1 }).limit(100)
  res.json(rows.map((a) => ({
    id: a._id,
    type: a.type,
    data: a.data,
    createdAt: a.createdAt,
    actor: a.actor ? { id: a.actor._id, name: a.actor.name, email: a.actor.email } : null,
  })))
}

module.exports = wrapAll({ listActivity })
