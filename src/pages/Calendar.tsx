import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import type { Task, Subject } from '../types'
import Sidebar from '../components/layout/sidebar'
import TopBar from '../components/layout/TopBar'

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export default function Calendar() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  useEffect(() => {
    async function fetchAll() {
      const [tasksRes, subjectsRes] = await Promise.all([
        supabase.from('tasks').select('*'),
        supabase.from('subjects').select('*'),
      ])
      if (tasksRes.data) setTasks(tasksRes.data)
      if (subjectsRes.data) setSubjects(subjectsRes.data)
      setLoading(false)
    }
    fetchAll()
  }, [])

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
    setSelectedDate(null)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
    setSelectedDate(null)
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)
  const monthName = new Date(viewYear, viewMonth).toLocaleString('en-MY', { month: 'long', year: 'numeric' })
  const todayStr = today.toISOString().split('T')[0]

  const getTasksForDate = (dateStr: string) =>
    tasks.filter(t => t.due_date === dateStr)

  const getSubject = (id: string | null) => subjects.find(s => s.id === id)

  const selectedTasks = selectedDate ? getTasksForDate(selectedDate) : []

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-60">
        <TopBar title="Calendar" />
        <main className="pt-16 p-6">
          <div className="grid grid-cols-3 gap-4">

            {/* Calendar grid */}
            <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-5">

              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-900">{monthName}</h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={prevMonth}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => { setViewMonth(today.getMonth()); setViewYear(today.getFullYear()); setSelectedDate(todayStr) }}
                    className="px-3 py-1 text-xs text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium"
                  >
                    Today
                  </button>
                  <button
                    onClick={nextMonth}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-1">
                {DAYS.map(day => (
                  <div key={day} className="text-center text-xs font-medium text-gray-400 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar cells */}
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-1">
                  {/* Empty cells before first day */}
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}

                  {/* Day cells */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1
                    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                    const dayTasks = getTasksForDate(dateStr)
                    const isToday = dateStr === todayStr
                    const isSelected = dateStr === selectedDate
                    const isPast = dateStr < todayStr
                    const hasOverdue = dayTasks.some(t => !t.completed) && isPast

                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)}
                        className={`relative min-h-16 p-1.5 rounded-lg text-left transition-all border ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-300'
                            : isToday
                            ? 'border-indigo-200 bg-indigo-50/50'
                            : 'border-transparent hover:bg-gray-50'
                        }`}
                      >
                        <span className={`text-xs font-medium block mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                          isToday
                            ? 'bg-indigo-600 text-white'
                            : isPast
                            ? 'text-gray-400'
                            : 'text-gray-700'
                        }`}>
                          {day}
                        </span>

                        {/* Task dots */}
                        <div className="flex flex-col gap-0.5">
                          {dayTasks.slice(0, 3).map(task => {
                            const subject = getSubject(task.subject_id)
                            const color = task.completed
                              ? '#d1d5db'
                              : hasOverdue
                              ? '#ef4444'
                              : subject?.color ?? '#6366f1'
                            return (
                              <div
                                key={task.id}
                                className="text-white text-xs px-1.5 py-0.5 rounded truncate"
                                style={{ backgroundColor: color, fontSize: '10px' }}
                              >
                                {task.title}
                              </div>
                            )
                          })}
                          {dayTasks.length > 3 && (
                            <span className="text-xs text-gray-400 px-1" style={{ fontSize: '10px' }}>
                              +{dayTasks.length - 3} more
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Selected date panel */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <p className="text-sm font-medium text-gray-900 mb-4">
                {selectedDate
                  ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long' })
                  : 'Select a date'}
              </p>

              {!selectedDate ? (
                <p className="text-sm text-gray-400">Click on a day to see tasks due on that date.</p>
              ) : selectedTasks.length === 0 ? (
                <p className="text-sm text-gray-400">No tasks due on this day.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {selectedTasks.map(task => {
                    const subject = getSubject(task.subject_id)
                    const priorityColors = {
                      high: 'text-red-600 bg-red-50',
                      medium: 'text-amber-600 bg-amber-50',
                      low: 'text-green-600 bg-green-50',
                    }
                    return (
                      <div key={task.id} className={`p-3 rounded-lg border ${task.completed ? 'border-gray-100 opacity-60' : 'border-gray-100'}`}>
                        <p className={`text-sm font-medium text-gray-900 ${task.completed ? 'line-through text-gray-400' : ''}`}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-gray-400 mt-0.5">{task.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {subject && (
                            <span
                              className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ backgroundColor: subject.color + '20', color: subject.color }}
                            >
                              {subject.name}
                            </span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[task.priority]}`}>
                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                          </span>
                          {task.completed && (
                            <span className="text-xs text-gray-400">Completed</span>
                          )}
                        </div>
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