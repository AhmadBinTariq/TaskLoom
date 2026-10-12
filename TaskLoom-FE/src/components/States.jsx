import Icon from './Icon'
import './States.css'

export function Spinner({ label = 'Loading' }) {
  return (
    <span className="spinner" role="status">
      <span className="visually-hidden">{label}</span>
    </span>
  )
}

export function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="state">
      <Spinner label={label} />
      <p className="muted">{label}</p>
    </div>
  )
}

export function EmptyState({ title, children, action }) {
  return (
    <div className="state">
      <h2>{title}</h2>
      {children && <p className="muted">{children}</p>}
      {action}
    </div>
  )
}

export function InlineError({ message }) {
  if (!message) return null
  return (
    <p className="alert alert--error" role="alert">
      <Icon name="alert" size={16} /> {message}
    </p>
  )
}
