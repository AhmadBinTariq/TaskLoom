import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { selectToasts, removeToast } from '../features/ui/uiSlice'
import './Toaster.css'

function ToastItem({ toast }) {
  const dispatch = useDispatch()

  useEffect(() => {
    const ms = toast.kind === 'error' ? 7000 : 4000
    const timer = setTimeout(() => dispatch(removeToast(toast.id)), ms)
    return () => clearTimeout(timer)
  }, [toast.id, toast.kind, dispatch])

  return (
    <div className={`toast toast-${toast.kind}`}>
      <span>{toast.text}</span>
      <button className="btn btn--ghost btn--icon" aria-label="Dismiss" onClick={() => dispatch(removeToast(toast.id))}>
        ×
      </button>
    </div>
  )
}

function Toaster() {
  const toasts = useSelector(selectToasts)
  return (
    <div className="toast-region" role="status" aria-live="polite">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  )
}

export default Toaster
