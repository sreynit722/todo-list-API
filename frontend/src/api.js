// Talks to the NestJS backend. Change the URL with VITE_API_URL in frontend/.env
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'
try {
  localStorage.removeItem('daymark_token')
} catch (error) {
  if (!(error instanceof DOMException && error.name === 'SecurityError')) throw error
}

let accessToken = null
let refreshPromise = null

export const hasToken = () => Boolean(accessToken)

// App.jsx registers a function here; it runs when the server says "not logged in"
let onUnauthorized = null
export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler
  return () => {
    if (onUnauthorized === handler) onUnauthorized = null
  }
}

// The UI shows friendly labels; the API uses TODO / IN_PROGRESS / DONE.
const STATUS_TO_API = { 'To Do': 'TODO', 'In Progress': 'IN_PROGRESS', Done: 'DONE' }
const STATUS_FROM_API = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' }

const fromApiTodo = (todo) => ({
  id: todo.id,
  title: todo.title,
  status: STATUS_FROM_API[todo.status] ?? 'To Do',
  date: todo.date ?? '',
  priority: Boolean(todo.priority),
})

const toApiChanges = (changes) => {
  const payload = { ...changes }
  if ('status' in payload) payload.status = STATUS_TO_API[payload.status]
  if ('date' in payload) payload.date = payload.date || null
  return payload
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      let response
      try {
        response = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        })
      } catch {
        throw new Error('Cannot reach the server. Is the backend running?')
      }

      if (response.status === 401) {
        accessToken = null
        return false
      }
      if (!response.ok) {
        throw new Error(`Unable to refresh session (${response.status})`)
      }

      const data = await response.json()
      accessToken = data.accessToken
      return true
    })().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

export const restoreSession = () => refreshAccessToken()

async function request(path, options = {}, { auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = accessToken
  if (auth && token) headers.Authorization = `Bearer ${token}`

  const send = () =>
    fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      credentials: 'include',
    })

  let response
  try {
    response = await send()
  } catch {
    throw new Error('Cannot reach the server. Is the backend running?')
  }

  if (response.status === 401 && auth) {
    try {
      if (await refreshAccessToken()) {
        headers.Authorization = `Bearer ${accessToken}`
        response = await send()
      }
    } catch (error) {
      accessToken = null
      if (onUnauthorized) onUnauthorized(error.message)
      throw error
    }
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const body = await response.json()
      if (body.message) message = Array.isArray(body.message) ? body.message.join(', ') : body.message
    } catch {
      // response had no JSON body
    }

    if (response.status === 401 && auth) {
      accessToken = null
      if (onUnauthorized) onUnauthorized(message)
    }
    throw new Error(message)
  }

  return response.status === 204 ? null : response.json()
}

// ---- accounts ----
export async function signup({ displayName, email, password }) {
  const data = await request(
    '/auth/signup',
    { method: 'POST', body: JSON.stringify({ displayName, email, password }) },
    { auth: false },
  )
  accessToken = data.accessToken
  return data.user
}

export async function login({ email, password }) {
  const data = await request(
    '/auth/login',
    { method: 'POST', body: JSON.stringify({ email, password }) },
    { auth: false },
  )
  accessToken = data.accessToken
  return data.user
}

export async function logout() {
  try {
    await request('/auth/logout', { method: 'POST' }, { auth: false })
  } finally {
    accessToken = null
  }
}

// ---- to-dos (each user only sees their own) ----
export const getTodos = async () => (await request('/todos')).map(fromApiTodo)

export const createTodo = async (todo) =>
  fromApiTodo(await request('/todos', { method: 'POST', body: JSON.stringify(toApiChanges(todo)) }))

export const updateTodo = async (id, changes) =>
  fromApiTodo(await request(`/todos/${id}`, { method: 'PATCH', body: JSON.stringify(toApiChanges(changes)) }))

export const deleteTodo = (id) => request(`/todos/${id}`, { method: 'DELETE' })

export const reorderTodos = (ids) =>
  request('/todos/reorder', { method: 'PUT', body: JSON.stringify({ ids }) })

// ---- profile ----
export const getProfile = () => request('/profile')

export const updateProfile = (changes) =>
  request('/profile', { method: 'PATCH', body: JSON.stringify(changes) })
