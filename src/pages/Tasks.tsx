import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, CheckCircle2, Circle, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import type { Task, Subject, Priority } from '../types'
import Sidebar from '../components/layout/sidebar'
import TopBar from '../components/layout/TopBar'

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'text-green-600 bg-green-50' },
  { value: 'medium', label: 'Medium', color: 'text-amber-600 bg-amber-50' },
  { value: 'high', label: 'High', color: 'text-red-600 bg-red-50' },
]

function isOverdue(due_date: string | null, completed: boolean) {
  if (!due_date || completed) return false
  return new Date(due_date) < new Date(new Date().toDateString())
}

function isDueToday(due_date: string | null, completed: boolean) {
  if (!due_date || completed) return false
  return new Date(due_date).toDateString() === new Date().toDateString()
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [filterSubject, setFilterSubject] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [search, setSearch] = useState('')

  // form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subjectId, setSubjectId] = useState<string>('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    const [tasksRes, subjectsRes] = await Promise.all([
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('subjects').select('*').order('name'),
    ])
    if (tasksRes.data) setTasks(tasksRes.data)
    if (subjectsRes.data) setSubjects(subjectsRes.data)
    setLoading(false)
  }

  function openCreate() {
    setEditingTask(null)
    setTitle('')
    setDescription('')
    setSubjectId('')
    setDueDate('')
    setPriority('medium')
    setError('')
    setShowModal(true)
  }

  function openEdit(task: Task) {
    setEditingTask(task)
    setTitle(task.title)
    setDescription(task.description ?? '')
    setSubjectId(task.subject_id ?? '')
    setDueDate(task.due_date ?? '')
    setPriority(task.priority)
    setError('')
    setShowModal(true)
  }

  async function handleSave() {
    if (!title.trim()) { setError('Task title is required'); return }
    setSaving(true)

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      subject_id: subjectId || null,
      due_date: dueDate || null,
      priority,
    }

    if (editingTask) {
      const { error } = await supabase.from('tasks').update(payload).eq('id', editingTask.id)
      if (error) { setError(error.message); setSaving(false); return }
      setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...payload } : t))
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('tasks')
        .insert({ ...payload, user_id: user!.id })
        .select()
        .single()
      if (error) { setError(error.message); setSaving(false); return }
      setTasks(prev => [data, ...prev])
    }

    setSaving(false)
    setShowModal(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this task?')) return
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (!error) setTasks(prev => prev.filter(t => t.id !== id))
  }

  async function toggleComplete(task: Task) {
    const { error } = await supabase
      .from('tasks')
      .update({ completed: !task.completed })
      .eq('id', task.id)
    if (!error) setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t))
  }

  const filteredTasks = tasks.filter(t => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false
    if (filterSubject !== 'all' && t.subject_id !== filterSubject) return false
    if (filterStatus === 'active' && t.completed) return false
    if (filterStatus === 'completed' && !t.completed) return false
    if (filterStatus === 'overdue' && !isOverdue(t.due_date, t.completed)) return false
    return true
  })
  .sort((a, b) => {
    // Completed tasks go to bottom
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    // Overdue first
    const aOverdue = isOverdue(a.due_date, a.completed)
    const bOverdue = isOverdue(b.due_date, b.completed)
    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1
    // Then by due date ascending
    if (a.due_date && b.due_date) {
    const dateDiff = new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    if (dateDiff !== 0) return dateDiff
    // Same due date — sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  }
  if (a.due_date) return -1
  if (b.due_date) return 1
  // No due date — by priority first, then created_at
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
  if (priorityDiff !== 0) return priorityDiff
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
})

  const getSubject = (id: string | null) => subjects.find(s => s.id === id)

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:ml-60">
        <TopBar title="Tasks" />
        <main className="pt-16 p-6">

          {/* Filters + Add button */}
          <div className="flex items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
            />
            <select
              value={filterSubject}
              onChange={e => setFilterSubject(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Subjects</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus size={16} />
            New Task
          </button>
        </div>

          {/* Task list */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <p className="text-gray-400 text-sm">No tasks found</p>
              <p className="text-gray-300 text-xs mt-1">
                {tasks.length === 0 ? 'Create your first task to get started' : 'Try changing the filters'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredTasks.map(task => {
                const subject = getSubject(task.subject_id)
                const overdue = isOverdue(task.due_date, task.completed)
                const dueToday = isDueToday(task.due_date, task.completed)
                const priorityInfo = PRIORITIES.find(p => p.value === task.priority)!

                return (
                  <div
                    key={task.id}
                    className={`bg-white rounded-xl border p-4 flex items-start gap-4 transition-all ${
                      overdue ? 'border-red-200 bg-red-50/30' : 'border-gray-100'
                    } ${task.completed ? 'opacity-60' : ''}`}
                  >
                    {/* Complete toggle */}
                    <button
                      onClick={() => toggleComplete(task)}
                      className="mt-0.5 text-gray-300 hover:text-indigo-600 transition-colors shrink-0"
                    >
                      {task.completed
                        ? <CheckCircle2 size={20} className="text-indigo-500" />
                        : <Circle size={20} />
                      }
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium text-gray-900 ${task.completed ? 'line-through text-gray-400' : ''}`}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => openEdit(task)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(task.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {task.description && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{task.description}</p>
                      )}

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {/* Subject badge */}
                        {subject && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ backgroundColor: subject.color + '20', color: subject.color }}
                          >
                            {subject.name}
                          </span>
                        )}

                        {/* Priority badge */}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityInfo.color}`}>
                          {priorityInfo.label}
                        </span>

                        {/* Due date */}
                        {task.due_date && (
                          <span className={`text-xs flex items-center gap-1 ${
                            overdue ? 'text-red-500 font-medium' : dueToday ? 'text-amber-500 font-medium' : 'text-gray-400'
                          }`}>
                            {overdue && <AlertCircle size={11} />}
                            {overdue ? 'Overdue · ' : dueToday ? 'Due today · ' : ''}
                            {new Date(task.due_date).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold text-gray-900 mb-4">
              {editingTask ? 'Edit Task' : 'New Task'}
            </h3>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Complete assignment 3"
                  autoFocus
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Optional details..."
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Subject</label>
                  <select
                    value={subjectId}
                    onChange={e => setSubjectId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">No subject</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Priority</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as Priority)}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {PRIORITIES.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}

              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingTask ? 'Save changes' : 'Create task'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}