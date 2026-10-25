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
const normLabel = (l) => ({ id: l.id || l._id, name: l.name, color: l.color })

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
  },
}
