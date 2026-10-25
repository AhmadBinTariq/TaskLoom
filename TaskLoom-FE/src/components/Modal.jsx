import { useEffect, useRef } from 'react'
import Icon from './Icon'
import './Modal.css'

function Modal({ open, title, onClose, children, variant = 'center' }) {
  const ref = useRef(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className={`modal-dialog modal-${variant}`}
      aria-label={title}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
    >
      {open && (
        <div className="modal-inner">
          <header className="modal-header">
            <h2>{title}</h2>
            <button className="btn btn--ghost btn--icon" onClick={onClose} aria-label="Close">
              <Icon name="close" />
            </button>
          </header>
          <div className="modal-body">{children}</div>
        </div>
      )}
    </dialog>
  )
}

export default Modal
