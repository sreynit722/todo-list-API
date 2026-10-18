// Talks to the NestJS backend. Change the URL with VITE_API_URL in frontend/.env
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

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

async function request(path, options = {}) {
  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
  } catch {
    throw new Error('Cannot reach the server. Is the backend running?')
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const body = await response.json()
      if (body.message) message = Array.isArray(body.message) ? body.message.join(', ') : body.message
    } catch {
      // response had no JSON body
    }
    throw new Error(message)
  }

  return response.status === 204 ? null : response.json()
}

export const getTodos = async () => (await request('/todos')).map(fromApiTodo)

export const createTodo = async (todo) =>
  fromApiTodo(await request('/todos', { method: 'POST', body: JSON.stringify(toApiChanges(todo)) }))

export const updateTodo = async (id, changes) =>
  fromApiTodo(await request(`/todos/${id}`, { method: 'PATCH', body: JSON.stringify(toApiChanges(changes)) }))

export const deleteTodo = (id) => request(`/todos/${id}`, { method: 'DELETE' })

export const reorderTodos = (ids) =>
  request('/todos/reorder', { method: 'PUT', body: JSON.stringify({ ids }) })

export const getProfile = () => request('/profile')

export const updateProfile = (changes) =>
  request('/profile', { method: 'PATCH', body: JSON.stringify(changes) })
