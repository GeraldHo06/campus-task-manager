import { useEffect } from 'react'
import type { Task } from '../types'

function isOverdue(due_date: string | null, completed: boolean) {
  if (!due_date || completed) return false
  return new Date(due_date) < new Date(new Date().toDateString())
}

function isDueToday(due_date: string | null, completed: boolean) {
  if (!due_date || completed) return false
  return new Date(due_date).toDateString() === new Date().toDateString()
}

export function useNotifications(tasks: Task[]) {
  useEffect(() => {
    if (!tasks.length) return

    if (!('Notification' in window)) return

    const notify = () => {
      const overdue = tasks.filter(t => isOverdue(t.due_date, t.completed))
      const dueToday = tasks.filter(t => isDueToday(t.due_date, t.completed))

      if (overdue.length > 0) {
        new Notification('Overdue Tasks', {
          body: `You have ${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}: ${overdue.map(t => t.title).join(', ')}`,
          icon: '/favicon.ico',
        })
      }

      if (dueToday.length > 0) {
        new Notification('Due Today', {
          body: `${dueToday.length} task${dueToday.length > 1 ? 's' : ''} due today: ${dueToday.map(t => t.title).join(', ')}`,
          icon: '/favicon.ico',
        })
      }
    }

    if (Notification.permission === 'granted') {
      notify()
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') notify()
      })
    }
  }, [tasks])
}