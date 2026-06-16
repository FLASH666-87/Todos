export { cn } from './new-york-v4/lib/utils'

import type { Todo, TodoDraft } from '@/types/todo'

export function buildNumberedTree(todos: Todo[]): Map<number, string> {
  const topLevel = todos
    .filter((t) => t.parentId === null)
    .sort((a, b) => a.id - b.id)

  const result = new Map<number, string>()

  const assignNumber = (todo: Todo, prefix: string) => {
    result.set(todo.id, prefix)
    const children = todos
      .filter((t) => t.parentId === todo.id)
      .sort((a, b) => a.id - b.id)

    children.forEach((child, index) => {
      assignNumber(child, prefix + '.' + (index + 1))
    })
  }

  topLevel.forEach((todo, index) => {
    assignNumber(todo, String(index + 1))
  })

  return result
}

export function buildReverseNumberLookup(todos: Todo[]): Map<string, number> {
  const numbered = buildNumberedTree(todos)
  const map = new Map<string, number>()
  for (const t of todos) {
    const num = numbered.get(t.id)
    if (num) map.set(num, t.id)
  }
  return map
}

export function getLevelOptions(
  todos: Todo[],
  path: string[],
): string[] {
  const lookup = buildReverseNumberLookup(todos)
  const options: string[] = []

  if (path.length === 0) {
    const topLevel = todos
      .filter((t) => t.parentId === null)
      .sort((a, b) => a.id - b.id)
    const numbered = buildNumberedTree(todos)
    for (const t of topLevel) {
      const num = numbered.get(t.id)
      if (num) options.push(num)
    }
    options.push(String(topLevel.length + 1))
    return options
  }

  const parentLabel = path[path.length - 1]
  const parentId = lookup.get(parentLabel)
  if (parentId === undefined) return [parentLabel]

  const numbered = buildNumberedTree(todos)
  const children = todos
    .filter((t) => t.parentId === parentId)
    .sort((a, b) => a.id - b.id)

  for (const child of children) {
    const num = numbered.get(child.id)
    if (num) options.push(num)
  }
  options.push(parentLabel + '.' + (children.length + 1))

  return options
}

export function computeFinalLabel(todos: Todo[], path: string[]): string {
  const lookup = buildReverseNumberLookup(todos)

  if (path.length === 0) {
    const topLevelCount = todos.filter((t) => t.parentId === null).length
    return String(topLevelCount + 1)
  }

  const pathLabel = path[path.length - 1]
  const currentId = lookup.get(pathLabel)
  if (currentId === undefined) return pathLabel

  const childrenCount = todos.filter((t) => t.parentId === currentId).length
  return pathLabel + '.' + (childrenCount + 1)
}

export function findParentId(todos: Todo[], path: string[]): number | null {
  if (path.length === 0) return null

  const lookup = buildReverseNumberLookup(todos)
  const pathLabel = path[path.length - 1]
  return lookup.get(pathLabel) ?? null
}

export function resolveChain(
  label: string,
  existingTodos: Todo[],
  draft: TodoDraft,
  today: string,
): Todo[] {
  const numbered = buildNumberedTree(existingTodos)
  const reverseMap = new Map<string, number>()
  for (const t of existingTodos) {
    const num = numbered.get(t.id)
    if (num) reverseMap.set(num, t.id)
  }

  const parts = label.split('.')
  const newTodos: Todo[] = []
  let parentId: number | null = null

  for (let i = 0; i < parts.length; i++) {
    const partialLabel = parts.slice(0, i + 1).join('.')
    const existingId = reverseMap.get(partialLabel)

    if (existingId !== undefined) {
      parentId = existingId
      continue
    }

    const isLast = i === parts.length - 1
    const newId = Date.now() + newTodos.length
    newTodos.push({
      id: newId,
      parentId,
      title: isLast ? draft.title : '(...)',
      description: isLast ? draft.description : '',
      completed: false,
      priority: isLast ? draft.priority : 'low',
      category: draft.category,
      dueDate: isLast ? draft.dueDate : today,
      createdAt: today,
    })
    parentId = newId
  }

  return newTodos
}
