import { Link } from 'react-router-dom'
import { dueState, formatDueDate } from '../app/format'
import Avatar from './Avatar'
import Icon from './Icon'
import './board.css'

const priorityText = { low: 'Low', medium: 'Medium', high: 'High' }

export function PriorityBadge({ priority }) {
  return (
    <span className="badge" style={{ color: `var(--priority-${priority})` }}>
      {priorityText[priority]}
    </span>
  )
}

export function LabelChip({ label }) {
  return (
    <span className="board-label">
      <span className="dot" style={{ color: `var(--label-${label.color})` }} />
      {label.name}
    </span>
  )
}

export function DueBadge({ date }) {
  const state = dueState(date)
  return (
    <span className={`board-due ${state === 'overdue' ? 'board-overdue' : state === 'today' ? 'board-today' : ''}`}>
      <Icon name="clock" size={12} />
      {state === 'overdue' ? 'Overdue · ' : state === 'today' ? 'Today · ' : ''}
      {formatDueDate(date)}
    </span>
  )
}

export function TaskCardContent({ task, to, labels, members }) {
  const assignee = members.find((m) => m.user.id === task.assigneeId)?.user
  const taskLabels = task.labelIds.map((id) => labels.find((l) => l.id === id)).filter(Boolean)

  return (
    <>
      <Link to={to} className="board-card-title">{task.title}</Link>

      {taskLabels.length > 0 && (
        <div className="board-card-labels">
          {taskLabels.map((l) => (
            <LabelChip key={l.id} label={l} />
          ))}
        </div>
      )}

      <div className="board-card-meta">
        <PriorityBadge priority={task.priority} />
        {task.dueDate && <DueBadge date={task.dueDate} />}
        <span className="board-spacer" />
        {assignee ? (
          <span title={`Assigned to ${assignee.name}`}>
            <Avatar name={assignee.name} size={24} />
            <span className="visually-hidden">Assigned to {assignee.name}</span>
          </span>
        ) : (
          <span className="muted" style={{ fontSize: '0.75rem' }}>Unassigned</span>
        )}
      </div>
    </>
  )
}
