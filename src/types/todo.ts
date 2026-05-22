export type Priority = 'low' | 'medium' | 'high'

export type StatusFilter = 'all' | 'active' | 'completed'

export type Todo = {
  id: number
  title: string
  description: string
  completed: boolean
  priority: Priority
  category: string
  dueDate: string
  createdAt: string
}

export type TodoDraft = {
  title: string
  description: string
  priority: Priority
  category: string
  dueDate: string
}

export type PriorityOption = {
  value: Priority
  label: string
}

export type CategoryCount = {
  name: string
  total: number
  active: number
}
