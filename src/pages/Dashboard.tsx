import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import type { Task, Subject } from '../types'
import Sidebar from '../components/layout/sidebar'
import TopBar from '../components/layout/TopBar'

function isOverdue(due_date: string | null, completed: boolean) {
  if (!due_date || completed) return false
  return new Date(due_date) < new Date(new Date().toDateString())
}

function isDueToday(due_date: string | null, completed: boolean) {
  if (!due_date || completed) return false
  return new Date(due_date).toDateString() === new Date().toDateString()
}

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function fetchAll() {
      const [tasksRes, subjectsRes] = await Promise.all([
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('subjects').select('*'),
      ])
      if (tasksRes.data) setTasks(tasksRes.data)
      if (subjectsRes.data) setSubjects(subjectsRes.data)
      setLoading(false)
    }
    fetchAll()
  }, [])

  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.completed).length
  const dueTodayTasks = tasks.filter(t => isDueToday(t.due_date, t.completed)).length
  const overdueTasks = tasks.filter(t => isOverdue(t.due_date, t.completed)).length
  const recentTasks = tasks.slice(0, 5)

  const getSubject = (id: string | null) => subjects.find(s => s.id === id)

  const stats = [
    { label: 'Total Tasks', value: totalTasks },
    { label: 'Due Today', value: dueTodayTasks },
    { label: 'Completed', value: completedTasks },
    { label: 'Overdue', value: overdueTasks, alert: overdueTasks > 0 },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-60">
        <TopBar title="Dashboard" />
        <main className="pt-16 p-6">

          {/* Stat cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {stats.map(({ label, value, alert }) => (
              <div key={label} className={`bg-white rounded-xl border p-5 ${alert ? 'border-red-200' : 'border-gray-100'}`}>
                <p className="text-sm text-gray-400">{label}</p>
                <p className={`text-2xl font-semibold mt-1 ${alert ? 'text-red-500' : 'text-gray-900'}`}>
                  {loading ? '—' : value}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Recent tasks */}
            <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-gray-900">Recent Tasks</p>
                <button
                  onClick={() => navigate('/tasks')}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  View all
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center py-6">
                  <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : recentTasks.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-400">No tasks yet</p>
                  <p className="text-xs text-gray-300 mt-1">Create a subject and add your first task</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {recentTasks.map(task => {
                    const subject = getSubject(task.subject_id)
                    const overdue = isOverdue(task.due_date, task.completed)
                    const dueToday = isDueToday(task.due_date, task.completed)

                    return (
                      <div key={task.id} className={`flex items-center gap-3 p-3 rounded-lg ${overdue ? 'bg-red-50' : 'bg-gray-50'} ${task.completed ? 'opacity-60' : ''}`}>
                        {task.completed
                          ? <CheckCircle2 size={16} className="text-indigo-500 shrink-0" />
                          : overdue
                          ? <AlertCircle size={16} className="text-red-400 shrink-0" />
                          : <Circle size={16} className="text-gray-300 shrink-0" />
                        }
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm text-gray-900 truncate ${task.completed ? 'line-through text-gray-400' : ''}`}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {subject && (
                              <span className="text-xs" style={{ color: subject.color }}>
                                {subject.name}
                              </span>
                            )}
                            {task.due_date && (
                              <span className={`text-xs ${overdue ? 'text-red-400' : dueToday ? 'text-amber-400' : 'text-gray-400'}`}>
                                {overdue ? 'Overdue' : dueToday ? 'Due today' : new Date(task.due_date).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Subjects summary */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-gray-900">Subjects</p>
                <button
                  onClick={() => navigate('/subjects')}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Manage
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center py-6">
                  <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : subjects.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-400">No subjects yet</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {subjects.map(subject => {
                    const count = tasks.filter(t => t.subject_id === subject.id && !t.completed).length
                    return (
                      <div key={subject.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: subject.color }} />
                          <span className="text-sm text-gray-700">{subject.name}</span>
                        </div>
                        <span className="text-xs text-gray-400">{count} active</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}