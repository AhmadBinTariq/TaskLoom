import { Link } from 'react-router-dom'
import { EmptyState } from '../components/States'

function NotFound() {
  return (
    <EmptyState
      title="Page not found"
      action={<Link className="btn btn--primary" to="/">Go home</Link>}
    >
      The page you are looking for does not exist.
    </EmptyState>
  )
}

export default NotFound
