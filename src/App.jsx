import { useMemo, useState } from 'react'
import './App.css'

const statuses = ['To Do', 'In Progress', 'Done']
const getDateValue = (dayOffset = 0) => {
  const date = new Date()
  date.setDate(date.getDate() + dayOffset)
  const timezoneOffset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10)
}

const formatTaskDate = (dateValue) => {
  if (!dateValue) return 'No date'
  const today = getDateValue()
  if (dateValue === today) return 'Today'
  if (dateValue === getDateValue(1)) return 'Tomorrow'
  if (dateValue === getDateValue(-1)) return 'Yesterday'
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${dateValue}T00:00:00`))
}

const initialTasks = [
  { id: 1, title: 'Review Q3 product roadmap', status: 'In Progress', date: getDateValue() },
  { id: 2, title: 'Send project update to the team', status: 'To Do', date: getDateValue() },
  { id: 3, title: 'Prepare notes for design sync', status: 'To Do', date: getDateValue(1) },
  { id: 4, title: 'Finalize homepage wireframes', status: 'Done', date: getDateValue(-1) },
  { id: 5, title: 'Organize customer feedback', status: 'In Progress', date: getDateValue(1) },
]

function Icon({ name, size = 20 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  const paths = {
    grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>,
    check: <><path d="m5 12 4 4L19 6" /><circle cx="12" cy="12" r="9" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    trash: <><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" /></>,
    edit: <><path d="m14 5 5 5M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z" /></>,
    chevron: <path d="m7 10 5 5 5-5" />,
    spark: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z" /></>,
    star: <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />,
    grip: <><circle cx="9" cy="5" r="1" /><circle cx="15" cy="5" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="9" cy="19" r="1" /><circle cx="15" cy="19" r="1" /></>,
  }

  return <svg {...common}>{paths[name]}</svg>
}

function App() {
  const [tasks, setTasks] = useState(initialTasks)
  const [activeFilter, setActiveFilter] = useState('All tasks')
  const [search, setSearch] = useState('')
  const [userName, setUserName] = useState('NEx')
  const [profileName, setProfileName] = useState(userName)
  const [editingProfile, setEditingProfile] = useState(false)
  const [taskBeingEdited, setTaskBeingEdited] = useState(null)
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskStatus, setTaskStatus] = useState('To Do')
  const [taskDate, setTaskDate] = useState(getDateValue())
  const [selectedTaskIds, setSelectedTaskIds] = useState(() => new Set())
  const [draggedTaskId, setDraggedTaskId] = useState(null)

  const counts = useMemo(() => ({
    all: tasks.length,
    todo: tasks.filter((task) => task.status === 'To Do').length,
    progress: tasks.filter((task) => task.status === 'In Progress').length,
    done: tasks.filter((task) => task.status === 'Done').length,
  }), [tasks])

  const visibleTasks = useMemo(() => {
    const query = search.trim().toLowerCase()
    return tasks.filter((task) => {
      const matchesFilter = activeFilter === 'All tasks' || task.status === activeFilter
      return matchesFilter && task.title.toLowerCase().includes(query)
    })
  }, [tasks, activeFilter, search])
  const allVisibleSelected = visibleTasks.length > 0
    && visibleTasks.every((task) => selectedTaskIds.has(task.id))

  const toggleTaskSelection = (id) => {
    setSelectedTaskIds((currentIds) => {
      const nextIds = new Set(currentIds)
      if (nextIds.has(id)) nextIds.delete(id)
      else nextIds.add(id)
      return nextIds
    })
  }

  const toggleVisibleSelection = () => {
    setSelectedTaskIds((currentIds) => {
      const nextIds = new Set(currentIds)
      if (allVisibleSelected) visibleTasks.forEach((task) => nextIds.delete(task.id))
      else visibleTasks.forEach((task) => nextIds.add(task.id))
      return nextIds
    })
  }

  const deleteSelectedTasks = () => {
    setTasks((currentTasks) => currentTasks.filter((task) => !selectedTaskIds.has(task.id)))
    setSelectedTaskIds(new Set())
  }

  const changeSelectedStatus = (status) => {
    setTasks((currentTasks) => currentTasks.map((task) => (
      selectedTaskIds.has(task.id) ? { ...task, status } : task
    )))
    setSelectedTaskIds(new Set())
  }

  const reorderTasks = (sourceId, targetId) => {
    if (sourceId === targetId) return
    const visibleIds = visibleTasks.map((task) => task.id)
    const sourceIndex = visibleIds.indexOf(sourceId)
    const targetIndex = visibleIds.indexOf(targetId)
    if (sourceIndex < 0 || targetIndex < 0) return

    const [movedId] = visibleIds.splice(sourceIndex, 1)
    visibleIds.splice(targetIndex, 0, movedId)
    const visibleIdSet = new Set(visibleIds)
    let visibleIndex = 0
    setTasks((currentTasks) => {
      const visibleTasksById = new Map(
        currentTasks.filter((task) => visibleIdSet.has(task.id)).map((task) => [task.id, task]),
      )
      return currentTasks.map((task) => {
        if (!visibleIdSet.has(task.id)) return task
        const orderedTask = visibleTasksById.get(visibleIds[visibleIndex++])
        return orderedTask ?? task
      })
    })
  }

  const openNewTask = () => {
    setTaskBeingEdited(null)
    setTaskTitle('')
    setTaskStatus('To Do')
    setTaskDate(getDateValue())
    setIsTaskFormOpen(true)
  }

  const openEditTask = (task) => {
    setTaskBeingEdited(task)
    setTaskTitle(task.title)
    setTaskStatus(task.status)
    setTaskDate(task.date || '')
    setIsTaskFormOpen(true)
  }

  const closeTaskForm = () => {
    setIsTaskFormOpen(false)
    setTaskBeingEdited(null)
  }

  const saveTask = (event) => {
    event.preventDefault()
    const title = taskTitle.trim()
    if (!title) return

    if (taskBeingEdited) {
      setTasks((currentTasks) => currentTasks.map((task) => (
        task.id === taskBeingEdited.id ? { ...task, title, status: taskStatus, date: taskDate } : task
      )))
    } else {
      setTasks((currentTasks) => [
        { id: Date.now(), title, status: taskStatus, date: taskDate },
        ...currentTasks,
      ])
    }
    closeTaskForm()
  }

  const changeStatus = (id, status) => {
    setTasks((currentTasks) => currentTasks.map((task) => (
      task.id === id ? { ...task, status } : task
    )))
  }

  const deleteTask = (id) => {
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== id))
    setSelectedTaskIds((currentIds) => {
      const nextIds = new Set(currentIds)
      nextIds.delete(id)
      return nextIds
    })
  }

  const togglePriority = (id) => {
    setTasks((currentTasks) => currentTasks.map((task) => (
      task.id === id ? { ...task, priority: !task.priority } : task
    )))
  }

  const saveProfile = (event) => {
    event.preventDefault()
    const name = profileName.trim()
    if (!name) return
    setUserName(name)
    setEditingProfile(false)
  }

  const filters = [
    { label: 'All tasks', count: counts.all, icon: 'grid' },
    { label: 'To Do', count: counts.todo, icon: 'calendar' },
    { label: 'In Progress', count: counts.progress, icon: 'spark' },
    { label: 'Done', count: counts.done, icon: 'check' },
  ]

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#home" aria-label="Daymark home">
          <span className="brand-mark"><Icon name="check" size={19} /></span>
          <span>daymark<span className="brand-period">.</span></span>
        </a>

        <div className="sidebar-label">WORKSPACE</div>
        <nav className="navigation" aria-label="Task filters">
          {filters.map((filter) => (
            <button
              className={`nav-item ${activeFilter === filter.label ? 'is-active' : ''}`}
              key={filter.label}
              onClick={() => setActiveFilter(filter.label)}
              type="button"
            >
              <Icon name={filter.icon} size={18} />
              <span>{filter.label}</span>
              <span className="nav-count">{filter.count}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-note">
          <div className="note-icon"><Icon name="spark" size={17} /></div>
          <strong>A little progress<br />goes a long way.</strong>
          <span>You’re doing great. Keep it up!</span>
          <div className="note-progress"><span style={{ width: `${counts.all ? (counts.done / counts.all) * 100 : 0}%` }} /></div>
          <small>{counts.done} of {counts.all} tasks completed</small>
        </div>

        <section className="profile-card" aria-label="Your profile">
          <div className="avatar">{userName.charAt(0).toUpperCase()}</div>
          {editingProfile ? (
            <form className="profile-edit" onSubmit={saveProfile}>
              <label className="sr-only" htmlFor="profile-name">Your name</label>
              <input
                id="profile-name"
                maxLength={40}
                onChange={(event) => setProfileName(event.target.value)}
                value={profileName}
                autoFocus
              />
              <div className="profile-edit-actions">
                <button type="submit">Save</button>
                <button type="button" onClick={() => { setProfileName(userName); setEditingProfile(false) }}>Cancel</button>
              </div>
            </form>
          ) : (
            <>
              <div className="profile-details">
                <strong>{userName}</strong>
                <span>Personal workspace</span>
              </div>
              <button
                className="profile-edit-button"
                type="button"
                aria-label="Edit profile"
                onClick={() => { setProfileName(userName); setEditingProfile(true) }}
              >
                <Icon name="edit" size={16} />
              </button>
            </>
          )}
        </section>
      </aside>

      <section className="main-panel" id="home">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><span className="breadcrumb-slash">/</span><strong>My tasks</strong></div>
          <div className="topbar-right">
            <span className="today-label"><span className="today-dot" /> Your personal space</span>
            <div className="topbar-avatar" title={userName}>{userName.charAt(0).toUpperCase()}</div>
          </div>
        </header>

        <div className="content">
          <section className="welcome-row">
            <div>
              <p className="eyebrow">YOUR WORK, AT A GLANCE</p>
              <h1>Good things take <span>focus.</span></h1>
              <p className="welcome-copy">Welcome back, {userName.split(' ')[0]}. Let’s make today count.</p>
            </div>
            <button className="primary-button" type="button" onClick={openNewTask}>
              <Icon name="plus" size={18} />
              <span>New task</span>
            </button>
          </section>

          <section className="task-section">
            <div className="task-heading">
              <div>
                <h2>My tasks <span>{visibleTasks.length}</span></h2>
                <p>One step at a time. You’ve got this.</p>
              </div>
              <label className="search-field">
                <Icon name="search" size={18} />
                <span className="sr-only">Search tasks</span>
                <input
                  type="search"
                  placeholder="Search tasks..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <kbd>/</kbd>
              </label>
            </div>

            <div className="task-filters" role="group" aria-label="Filter tasks">
              {filters.map((filter) => (
                <button
                  type="button"
                  className={`filter-chip ${activeFilter === filter.label ? 'selected' : ''}`}
                  onClick={() => setActiveFilter(filter.label)}
                  key={filter.label}
                >
                  {filter.label}<span>{filter.count}</span>
                </button>
              ))}
            </div>

            <div className="task-list">
              <div className="task-list-header">
                <span className="task-name-heading">
                  <input
                    aria-label="Select all visible tasks"
                    checked={allVisibleSelected}
                    onChange={toggleVisibleSelection}
                    type="checkbox"
                  />
                  <span>TASK NAME</span>
                </span>
                <span>STATUS</span>
                <span>WHEN</span>
                <span className="sr-only">Actions</span>
              </div>
              {selectedTaskIds.size > 0 && (
                <div className="bulk-toolbar">
                  <span>{selectedTaskIds.size} selected</span>
                  <label className="bulk-status-label">
                    <span className="sr-only">Change selected tasks status</span>
                    <select defaultValue="" onChange={(event) => { if (event.target.value) changeSelectedStatus(event.target.value) }}>
                      <option value="" disabled>Change status</option>
                      {statuses.map((status) => <option key={status}>{status}</option>)}
                    </select>
                    <Icon name="chevron" size={13} />
                  </label>
                  <button className="bulk-delete" type="button" onClick={deleteSelectedTasks}>
                    <Icon name="trash" size={15} />
                    Delete selected
                  </button>
                  <button className="bulk-clear" type="button" onClick={() => setSelectedTaskIds(new Set())}>Clear</button>
                </div>
              )}
              {visibleTasks.map((task) => (
                <article
                  className={`task-row ${draggedTaskId === task.id ? 'is-dragging' : ''}`}
                  key={task.id}
                  draggable
                  onDragStart={(event) => {
                    if (!event.target.closest('.drag-handle')) {
                      event.preventDefault()
                      return
                    }
                    event.dataTransfer.effectAllowed = 'move'
                    event.dataTransfer.setData('text/plain', String(task.id))
                    setDraggedTaskId(task.id)
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault()
                    const sourceId = Number(event.dataTransfer.getData('text/plain'))
                    reorderTasks(sourceId, task.id)
                    setDraggedTaskId(null)
                  }}
                  onDragEnd={() => setDraggedTaskId(null)}
                >
                  <div className="task-title-cell">
                    <input
                      aria-label={`Select ${task.title}`}
                      checked={selectedTaskIds.has(task.id)}
                      className="task-selection"
                      onChange={() => toggleTaskSelection(task.id)}
                      type="checkbox"
                    />
                    <span className="drag-handle" draggable aria-label={`Reorder ${task.title}`} title="Drag to reorder">
                      <Icon name="grip" size={16} />
                    </span>
                    <button
                      aria-label={`${task.status === 'Done' ? 'Mark as not done' : 'Mark as done'}: ${task.title}`}
                      aria-pressed={task.status === 'Done'}
                      className={`task-check ${task.status === 'Done' ? 'checked' : ''}`}
                      onClick={() => changeStatus(task.id, task.status === 'Done' ? 'To Do' : 'Done')}
                      type="button"
                    >
                      {task.status === 'Done' && <Icon name="check" size={13} />}
                    </button>
                    <span className={task.status === 'Done' ? 'task-title completed-title' : 'task-title'}>{task.title}</span>
                    <button
                      aria-label={`${task.priority ? 'Remove priority from' : 'Mark as priority'} ${task.title}`}
                      aria-pressed={Boolean(task.priority)}
                      className={`priority-button ${task.priority ? 'is-priority' : ''}`}
                      onClick={() => togglePriority(task.id)}
                      type="button"
                    >
                      <Icon name="star" size={16} />
                    </button>
                  </div>
                  <div className="task-status-cell">
                    <label className={`status-pill status-${task.status.toLowerCase().replace(' ', '-')}`}>
                      <span />
                      <span className="sr-only">Status: </span>
                      <select
                        aria-label={`Status for ${task.title}`}
                        value={task.status}
                        onChange={(event) => changeStatus(task.id, event.target.value)}
                      >
                        {statuses.map((status) => <option key={status}>{status}</option>)}
                      </select>
                      <Icon name="chevron" size={13} />
                    </label>
                  </div>
                  <span className="task-date">{formatTaskDate(task.date)}</span>
                  <div className="task-actions">
                    <button type="button" aria-label={`Edit ${task.title}`} onClick={() => openEditTask(task)}>
                      <Icon name="edit" size={16} />
                    </button>
                    <button type="button" aria-label={`Delete ${task.title}`} onClick={() => deleteTask(task.id)}>
                      <Icon name="trash" size={16} />
                    </button>
                  </div>
                </article>
              ))}
              {visibleTasks.length === 0 && (
                <div className="empty-state">
                  <span className="empty-icon"><Icon name={search ? 'search' : 'check'} size={23} /></span>
                  <strong>{search ? 'No tasks found' : 'Nothing on your list yet'}</strong>
                  <span>{search ? 'Try another search term.' : 'Add a task and make your next move.'}</span>
                  {!search && <button type="button" onClick={openNewTask}>Create your first task</button>}
                </div>
              )}
            </div>
            <p className="list-footnote">Showing {visibleTasks.length} of {counts.all} tasks</p>
          </section>
          <footer className="page-footer">Made for your next little win <span>✳</span></footer>
        </div>
      </section>

      {isTaskFormOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeTaskForm() }}>
          <section className="task-modal" role="dialog" aria-modal="true" aria-labelledby="task-modal-title">
            <div className="modal-heading">
              <div>
                <p className="eyebrow">{taskBeingEdited ? 'MAKE AN UPDATE' : 'MAKE IT HAPPEN'}</p>
                <h2 id="task-modal-title">{taskBeingEdited ? 'Edit task' : 'Create a task'}</h2>
              </div>
              <button className="modal-close" type="button" aria-label="Close" onClick={closeTaskForm}><Icon name="close" size={19} /></button>
            </div>
            <form onSubmit={saveTask}>
              <label className="form-label" htmlFor="task-title">Task title</label>
              <input
                autoFocus
                className="task-input"
                id="task-title"
                maxLength={120}
                onChange={(event) => setTaskTitle(event.target.value)}
                placeholder="What would you like to get done?"
                required
                value={taskTitle}
              />
              <label className="form-label" htmlFor="task-date">When</label>
              <input
                className="task-input"
                id="task-date"
                onChange={(event) => setTaskDate(event.target.value)}
                type="date"
                value={taskDate}
              />
              <label className="form-label" htmlFor="task-status">Status</label>
              <select
                className="task-input"
                id="task-status"
                onChange={(event) => setTaskStatus(event.target.value)}
                value={taskStatus}
              >
                {statuses.map((status) => <option key={status}>{status}</option>)}
              </select>
              <div className="modal-actions">
                <button className="secondary-button" type="button" onClick={closeTaskForm}>Cancel</button>
                <button className="primary-button" type="submit">{taskBeingEdited ? 'Save changes' : 'Create task'}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}

export default App
