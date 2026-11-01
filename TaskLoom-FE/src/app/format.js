export function todayIso(now = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function formatDueDate(date) {
  const [y, m, d] = date.split('-').map(Number)
  const value = new Date(y, m - 1, d)
  const sameYear = y === new Date().getFullYear()
  const options = sameYear ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' }
  return value.toLocaleDateString(undefined, options)
}

export function dueState(date) {
  if (!date) return null
  const today = todayIso()
  if (date < today) return 'overdue'
  if (date === today) return 'today'
  return 'upcoming'
}

export function timeAgo(iso) {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 45) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}
