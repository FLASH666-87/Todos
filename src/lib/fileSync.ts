import type { Todo } from '@/types/todo'

export async function loadTodosFromDisk(): Promise<Todo[] | null> {
  try {
    const res = await fetch('/api/todos')
    if (!res.ok) return null
    return await res.json() as Todo[]
  } catch {
    return null
  }
}

export async function saveTodosToDisk(todos: Todo[]): Promise<void> {
  try {
    await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(todos),
    })
  } catch {
    // silently fail — disk sync is a convenience, not critical
  }
}
