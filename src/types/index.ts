export type Priority = 'low' | 'medium' | 'high'

export interface Subject {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export interface Task {
  id: string
  user_id: string
  subject_id: string | null
  title: string
  description: string | null
  due_date: string | null
  priority: Priority
  completed: boolean
  created_at: string
}