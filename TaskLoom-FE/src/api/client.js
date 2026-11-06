const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api'

async function request(path, options = {}) {
  const token = localStorage.getItem('taskloom-token')
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = 'Bearer ' + token
  const res = await fetch(BASE + path, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }
  if (!res.ok) {
    throw new Error((data && data.message) || 'Request failed')
  }
  return data
}

const get = (p) => request(p)
const post = (p, body) => request(p, { method: 'POST', body })
const patch = (p, body) => request(p, { method: 'PATCH', body })
const del = (p) => request(p, { method: 'DELETE' })

const normUser = (u) => (u ? { id: u.id || u._id, name: u.name, email: u.email, theme: u.theme } : null)
const normProject = (p) => ({ id: p.id || p._id, name: p.name, description: p.description, taskCount: p.taskCount, workspaceId: p.workspace })
const normColumn = (c) => ({ id: c.id || c._id, name: c.name, position: c.position, projectId: c.project })
const normTask = (t) => ({
  id: t.id || t._id,
  title: t.title,
  description: t.description,
  assigneeId: t.assignee || null,
  dueDate: t.dueDate || null,
  priority: t.priority,
  labelIds: (t.labels || []).map(String),
  position: t.position,
  columnId: t.column,
  projectId: t.project,
  workspaceId: t.workspace,
  createdBy: t.createdBy,
  createdAt: t.createdAt,
  updatedAt: t.updatedAt,
})
const normLabel = (l) => ({ id: l.id || l._id, name: l.name, color: l.color })
const normComment = (c) => ({ id: c.id || c._id, body: c.body, mentionIds: (c.mentions || c.mentionIds || []).map(String), createdAt: c.createdAt, author: c.author })
const normActivity = (a) => ({ id: a.id || a._id, type: a.type, data: a.data, createdAt: a.createdAt, actor: a.actor })

export const api = {
  auth: {
    register: (body) => post('/auth/register', body),
    login: (body) => post('/auth/login', body),
    me: () => get('/auth/me').then(normUser),
  },
  workspaces: {
    list: () => get('/workspaces'),
    get: (id) => get(`/workspaces/${id}`),
    create: (name) => post('/workspaces', { name }),
    rename: (id, name) => patch(`/workspaces/${id}`, { name }),
    remove: (id) => del(`/workspaces/${id}`),
    leave: (id) => post(`/workspaces/${id}/leave`),
  },
  members: {
    list: (id) => get(`/workspaces/${id}/members`),
  },
  labels: {
    list: (id) => get(`/workspaces/${id}/labels`).then((ls) => ls.map(normLabel)),
    create: (id, body) => post(`/workspaces/${id}/labels`, body).then(normLabel),
    remove: (id, labelId) => del(`/workspaces/${id}/labels/${labelId}`),
  },
  projects: {
    list: (id) => get(`/workspaces/${id}/projects`).then((ps) => ps.map(normProject)),
    create: (id, body) => post(`/workspaces/${id}/projects`, body).then(normProject),
    update: (id, body) => patch(`/projects/${id}`, body).then(normProject),
    remove: (id) => del(`/projects/${id}`),
    board: (id) => get(`/projects/${id}/board`).then((b) => ({ project: normProject(b.project), columns: b.columns.map(normColumn), tasks: b.tasks.map(normTask) })),
  },
  columns: {
    create: (projectId, name) => post(`/projects/${projectId}/columns`, { name }).then(normColumn),
    rename: (id, name) => patch(`/columns/${id}`, { name }).then(normColumn),
    remove: (id) => del(`/columns/${id}`),
  },
  tasks: {
    create: (projectId, body) => post(`/projects/${projectId}/tasks`, body).then(normTask),
    get: (id) => get(`/tasks/${id}`).then(normTask),
    update: (id, body) => patch(`/tasks/${id}`, body).then(normTask),
    move: (id, body) => patch(`/tasks/${id}/move`, body).then(normTask),
    remove: (id) => del(`/tasks/${id}`),
  },
  comments: {
    list: (taskId) => get(`/tasks/${taskId}/comments`).then((cs) => cs.map(normComment)),
    create: (taskId, body) => post(`/tasks/${taskId}/comments`, body).then(normComment),
  },
  activity: {
    list: (params) => get('/activity?' + new URLSearchParams(params)).then((as) => as.map(normActivity)),
  },
}
