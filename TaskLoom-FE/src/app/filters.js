import { todayIso } from './format'

export const emptyFilters = {
  text: '',
  assigneeId: 'any',
  labelId: 'any',
  priority: 'any',
  due: 'any',
}

export function hasActiveFilters(f) {
  return f.text.trim() !== '' || f.assigneeId !== 'any' || f.labelId !== 'any' || f.priority !== 'any' || f.due !== 'any'
}

function addDays(iso, days) {
  const [y, m, d] = iso.split('-').map(Number)
  return todayIso(new Date(y, m - 1, d + days))
}

export function matchesFilters(task, f, today = todayIso()) {
  const text = f.text.trim().toLowerCase()
  if (text && !task.title.toLowerCase().includes(text) && !task.description.toLowerCase().includes(text)) return false

  if (f.assigneeId === 'unassigned' && task.assigneeId !== null) return false
  if (f.assigneeId !== 'any' && f.assigneeId !== 'unassigned' && task.assigneeId !== f.assigneeId) return false

  if (f.labelId !== 'any' && !task.labelIds.includes(f.labelId)) return false
  if (f.priority !== 'any' && task.priority !== f.priority) return false

  if (f.due === 'none') return task.dueDate === null
  if (f.due === 'overdue') return task.dueDate !== null && task.dueDate < today
  if (f.due === 'today') return task.dueDate === today
  if (f.due === 'week') return task.dueDate !== null && task.dueDate >= today && task.dueDate <= addDays(today, 7)
  return true
}
