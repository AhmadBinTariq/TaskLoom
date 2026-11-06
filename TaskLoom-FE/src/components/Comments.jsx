import { useState, useEffect, useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { api } from '../api/client'
import { toast } from '../features/ui/uiSlice'
import { timeAgo } from '../app/format'
import Avatar from './Avatar'
import './tasks.css'

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function renderBody(comment, members) {
  const names = comment.mentionIds
    .map((id) => members.find((m) => m.user.id === id)?.user.name)
    .filter(Boolean)
  if (names.length === 0) return comment.body
  const pattern = new RegExp(`(${names.map((n) => `@${escapeRegex(n)}`).join('|')})`, 'g')
  return comment.body.split(pattern).map((part, i) =>
    i % 2 === 1 ? <span key={i} className="task-mention">{part}</span> : part,
  )
}

function Comments({ taskId, members, canComment }) {
  const dispatch = useDispatch()
  const [comments, setComments] = useState([])
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    api.comments.list(taskId).then(setComments).catch(() => setComments([]))
  }, [taskId])

  useEffect(() => {
    load()
  }, [load])

  async function submit(e) {
    e.preventDefault()
    const text = body.trim()
    if (!text) return
    const mentions = members.filter((m) => text.includes(`@${m.user.name}`)).map((m) => m.user.id)
    setBusy(true)
    try {
      await api.comments.create(taskId, { body: text, mentions })
      setBody('')
      load()
    } catch (err) {
      dispatch(toast(err.message, 'error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="task-section">
      <h3>Comments</h3>
      {comments.length === 0 && <p className="muted">No comments yet.</p>}
      {comments.length > 0 && (
        <ol className="task-comments">
          {comments.map((c) => (
            <li key={c.id}>
              <Avatar name={c.author.name} size={28} />
              <div>
                <p className="task-comment-meta">
                  <strong>{c.author.name}</strong>{' '}
                  <time className="muted" dateTime={c.createdAt} title={new Date(c.createdAt).toLocaleString()}>{timeAgo(c.createdAt)}</time>
                </p>
                <p className="task-comment-body">{renderBody(c, members)}</p>
              </div>
            </li>
          ))}
        </ol>
      )}

      {canComment ? (
        <form onSubmit={submit} className="task-composer">
          <label htmlFor={`comment-${taskId}`} className="visually-hidden">Write a comment</label>
          <textarea
            id={`comment-${taskId}`}
            className="input"
            placeholder="Write a comment… Type @ and a member's name to mention them."
            value={body}
            maxLength={2000}
            onChange={(e) => setBody(e.target.value)}
          />
          <div>
            <button className="btn btn--primary btn--sm" disabled={busy || !body.trim()}>Comment</button>
          </div>
        </form>
      ) : (
        <p className="muted">Viewers can read comments but cannot post.</p>
      )}
    </section>
  )
}

export default Comments
