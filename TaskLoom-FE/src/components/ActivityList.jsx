import { timeAgo } from '../app/format'
import Avatar from './Avatar'
import { EmptyState } from './States'
import './tasks.css'

function describe(a) {
  const d = a.data
  switch (a.type) {
    case 'task.created':
      return `created "${d.title}"${d.column ? ` in ${d.column}` : ''}`
    case 'task.updated':
      return `changed ${d.fields} on "${d.title}"`
    case 'task.moved':
      return `moved "${d.title}" from ${d.from} to ${d.to}`
    case 'task.deleted':
      return `deleted "${d.title}"`
    case 'comment.created':
      return `commented on "${d.title}"`
    case 'project.created':
      return `created project ${d.name}`
    case 'project.updated':
      return `updated project ${d.name}`
    case 'column.created':
      return `added column ${d.name}`
    case 'column.renamed':
      return `renamed column ${d.from} to ${d.to}`
    case 'column.deleted':
      return `deleted column ${d.name}`
    default:
      return 'made a change'
  }
}

function ActivityList({ items }) {
  if (!items || items.length === 0) return <EmptyState title="No activity yet" />
  return (
    <ol className="task-activity">
      {items.map((a) => (
        <li key={a.id}>
          <Avatar name={a.actor.name} size={24} />
          <p>
            <strong>{a.actor.name}</strong> {describe(a)}
            <time className="muted" dateTime={a.createdAt} title={new Date(a.createdAt).toLocaleString()}>
              {' · '}
              {timeAgo(a.createdAt)}
            </time>
          </p>
        </li>
      ))}
    </ol>
  )
}

export default ActivityList
