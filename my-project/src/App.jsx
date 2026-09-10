import { useState, useRef, useEffect } from 'react'
import './App.css'

const FILTERS = ['All', 'Active', 'Done']

function App() {
  const [tasks, setTasks] = useState([
    { id: crypto.randomUUID(), text: 'Design the landing page', done: false },
    { id: crypto.randomUUID(), text: 'Set up CI/CD pipeline', done: true },
    { id: crypto.randomUUID(), text: 'Write API documentation', done: false },
  ])
  const [input, setInput] = useState('')
  const [filter, setFilter] = useState('Active')
  const [dragIdx, setDragIdx] = useState(null)
  const [overIdx, setOverIdx] = useState(null)
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')
  const inputRef = useRef(null)

  // ── Theme ─────────────────────────────────────────
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark')

  // ── CRUD ──────────────────────────────────────────
  const addTask = () => {
    const trimmed = input.trim()
    if (!trimmed) return
    setTasks(prev => [
      { id: crypto.randomUUID(), text: trimmed, done: false },
      ...prev,
    ])
    setInput('')
    inputRef.current?.focus()
  }

  const toggleTask = (id) => {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, done: !t.done } : t))
    )
  }

  const deleteTask = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  // ── Drag & Drop (on the full unfiltered list) ─────
  const handleDragStart = (idx) => setDragIdx(idx)
  const handleDragEnd = () => { setDragIdx(null); setOverIdx(null) }

  const handleDragOver = (e, idx) => {
    e.preventDefault()
    if (idx !== overIdx) setOverIdx(idx)
  }

  const handleDrop = (dropIdx) => {
    if (dragIdx === null || dragIdx === dropIdx) return
    setTasks(prev => {
      const next = [...prev]
      const [moved] = next.splice(dragIdx, 1)
      next.splice(dropIdx, 0, moved)
      return next
    })
    setDragIdx(null)
    setOverIdx(null)
  }

  // ── Derived data ──────────────────────────────────
  const filtered = tasks.filter(t => {
    if (filter === 'Active') return !t.done
    if (filter === 'Done') return t.done
    return true
  })

  const total = tasks.length
  const doneCount = tasks.filter(t => t.done).length
  const activeCount = total - doneCount

  return (
    <div className="app">
      {/* Theme Toggle */}
      <button
        className="theme-toggle"
        id="theme-toggle"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        <span className="theme-toggle__icon">
          {theme === 'dark' ? '☀️' : '🌙'}
        </span>
      </button>

      {/* Header */}
      <header className="header">
        <h1 className="header__title">Taskflow</h1>
        <p className="header__subtitle">Drag to reorder · Click to complete</p>
      </header>

      {/* Stats */}
      <div className="stats">
        <div className="stats__pill" id="stat-total">
          <span className="stats__number">{total}</span>
          <span className="stats__label">Total</span>
        </div>
        <div className="stats__pill" id="stat-active">
          <span className="stats__number">{activeCount}</span>
          <span className="stats__label">Active</span>
        </div>
        <div className="stats__pill" id="stat-done">
          <span className="stats__number">{doneCount}</span>
          <span className="stats__label">Done</span>
        </div>
      </div>

      {/* Input */}
      <form
        className="input-row"
        onSubmit={(e) => { e.preventDefault(); addTask() }}
      >
        <input
          ref={inputRef}
          id="task-input"
          className="input-row__field"
          type="text"
          placeholder="What needs to be done?"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="input-row__btn" id="add-btn">
          Add
        </button>
      </form>

      {/* Filters */}
      <div className="filters" role="tablist">
        {FILTERS.map(f => (
          <button
            key={f}
            id={`filter-${f.toLowerCase()}`}
            className={`filters__tab${filter === f ? ' filters__tab--active' : ''}`}
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Task List */}
      {filtered.length === 0 ? (
        <div className="empty">
          <div className="empty__icon">✨</div>
          <p className="empty__text">
            {filter === 'Done' ? 'No completed tasks yet' :
             filter === 'Active' ? 'All caught up!' :
             'Add your first task above'}
          </p>
          <p className="empty__hint">
            {filter === 'All' ? 'Type something and hit Add' : 'Switch filters to see other tasks'}
          </p>
        </div>
      ) : (
        <div className="task-list" role="list">
          {filtered.map((task) => {
            // Use unfiltered index for drag/drop so reorder works correctly
            const realIdx = tasks.findIndex(t => t.id === task.id)
            return (
              <div
                key={task.id}
                id={`task-${task.id}`}
                className={[
                  'task',
                  task.done && 'task--done',
                  dragIdx === realIdx && 'task--dragging',
                  overIdx === realIdx && dragIdx !== realIdx && 'task--drag-over',
                ].filter(Boolean).join(' ')}
                role="listitem"
                draggable
                onDragStart={() => handleDragStart(realIdx)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, realIdx)}
                onDrop={() => handleDrop(realIdx)}
              >
                {/* Grip */}
                <span className="task__grip" aria-hidden="true">
                  <span className="task__grip-dot" />
                  <span className="task__grip-dot" />
                  <span className="task__grip-dot" />
                </span>

                {/* Checkbox */}
                <button
                  className={`task__checkbox${task.done ? ' task__checkbox--checked' : ''}`}
                  onClick={() => toggleTask(task.id)}
                  aria-label={task.done ? 'Mark as active' : 'Mark as done'}
                />

                {/* Text */}
                <span className="task__text">{task.text}</span>

                {/* Delete */}
                <button
                  className="task__delete"
                  onClick={() => deleteTask(task.id)}
                  aria-label="Delete task"
                >
                  ✕
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <p className="footer__text">Drag tasks to reorder · Built with React + Vite</p>
      </footer>
    </div>
  )
}

export default App
