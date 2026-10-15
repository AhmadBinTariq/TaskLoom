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

export const api = {
  auth: {
    register: (body) => post('/auth/register', body),
    login: (body) => post('/auth/login', body),
    me: () => get('/auth/me').then(normUser),
  },
  workspaces: {
    list: () => get('/workspaces'),
  },
}
