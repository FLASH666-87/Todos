<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Plus } from 'lucide-vue-next'
import CategorySummary from '@/components/todos/CategorySummary.vue'
import TodoForm from '@/components/todos/TodoForm.vue'
import TodoHeader from '@/components/todos/TodoHeader.vue'
import TodoList from '@/components/todos/TodoList.vue'
import {
  deleteCompletedTodosFromSqlite,
  deleteTodoFromSqlite,
  initializeTodoDatabase,
  insertTodoIntoSqlite,
  listTodosFromSqlite,
  updateTodoCompletedInSqlite,
} from '@/lib/todoSqlite'
import type { Priority, PriorityOption, StatusFilter, Todo, TodoDraft } from '@/types/todo'

const today = new Date().toISOString().slice(0, 10)

const defaultTodos = (): Todo[] => [
  {
    id: 1,
    title: 'Learn Vue state and v-model',
    description: 'Practice how form input updates reactive state.',
    completed: false,
    priority: 'high',
    category: 'Course',
    dueDate: today,
    createdAt: '2026-05-19',
  },
  {
    id: 2,
    title: 'Add validation to the TODO form',
    description: 'Disable submit until the title is long enough.',
    completed: false,
    priority: 'medium',
    category: 'Course',
    dueDate: '2026-05-24',
    createdAt: '2026-05-20',
  },
  {
    id: 3,
    title: 'Prepare component extraction exercise',
    description: 'Use this large App.vue as the reason to split files.',
    completed: true,
    priority: 'high',
    category: 'Teaching',
    dueDate: '2026-05-21',
    createdAt: '2026-05-20',
  },
  {
    id: 4,
    title: 'Explain refresh state loss',
    description: 'Show that memory state resets when the app reloads.',
    completed: false,
    priority: 'low',
    category: 'Teaching',
    dueDate: '2026-05-25',
    createdAt: '2026-05-21',
  },
]

const search = ref('')
const statusFilter = ref<StatusFilter>('all')
const priorityFilter = ref<'all' | Priority>('all')
const categoryFilter = ref('all')
const hideCompleted = ref(false)
const isLoadingTodos = ref(true)
const dataSourceLabel = ref('Browser SQLite')
const isUsingSqlite = ref(false)
const todos = ref<Todo[]>([])

const categories = ['Course', 'Teaching', 'Homework', 'Review', 'Personal']
const priorities: PriorityOption[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

const activeTodos = computed(() => todos.value.filter((todo) => !todo.completed))
const completedTodos = computed(() => todos.value.filter((todo) => todo.completed))
const highPriorityTodos = computed(() => todos.value.filter((todo) => todo.priority === 'high'))
const overdueTodos = computed(() => {
  return todos.value.filter((todo) => !todo.completed && todo.dueDate < today)
})

const filteredTodos = computed(() => {
  const keyword = search.value.trim().toLowerCase()

  return todos.value
    .filter((todo) => {
      if (statusFilter.value === 'active') return !todo.completed
      if (statusFilter.value === 'completed') return todo.completed
      return true
    })
    .filter((todo) => {
      if (hideCompleted.value) return !todo.completed
      return true
    })
    .filter((todo) => {
      if (priorityFilter.value === 'all') return true
      return todo.priority === priorityFilter.value
    })
    .filter((todo) => {
      if (categoryFilter.value === 'all') return true
      return todo.category === categoryFilter.value
    })
    .filter((todo) => {
      if (!keyword) return true

      return (
        todo.title.toLowerCase().includes(keyword) ||
        todo.description.toLowerCase().includes(keyword) ||
        todo.category.toLowerCase().includes(keyword)
      )
    })
    .sort((first, second) => {
      const order: Record<Priority, number> = {
        high: 0,
        medium: 1,
        low: 2,
      }

      if (first.completed !== second.completed) {
        return Number(first.completed) - Number(second.completed)
      }

      if (first.priority !== second.priority) {
        return order[first.priority] - order[second.priority]
      }

      return first.dueDate.localeCompare(second.dueDate)
    })
})

const categoryCounts = computed(() => {
  return categories.map((name) => {
    const items = todos.value.filter((todo) => todo.category === name)

    return {
      name,
      total: items.length,
      active: items.filter((todo) => !todo.completed).length,
    }
  })
})

const refreshTodosFromSqlite = () => {
  todos.value = listTodosFromSqlite()
}

const addTodo = async (draft: TodoDraft) => {
  if (isUsingSqlite.value) {
    await insertTodoIntoSqlite(draft, today)
    refreshTodosFromSqlite()
    return
  }

  todos.value.push({
    id: Date.now(),
    title: draft.title,
    description: draft.description,
    completed: false,
    priority: draft.priority,
    category: draft.category,
    dueDate: draft.dueDate,
    createdAt: today,
  })
}

const toggleTodo = async (id: number) => {
  const todo = todos.value.find((item) => item.id === id)
  if (!todo) return

  if (isUsingSqlite.value) {
    await updateTodoCompletedInSqlite(id, !todo.completed)
    refreshTodosFromSqlite()
    return
  }

  todo.completed = !todo.completed
}

const deleteTodo = async (id: number) => {
  if (isUsingSqlite.value) {
    await deleteTodoFromSqlite(id)
    refreshTodosFromSqlite()
    return
  }

  todos.value = todos.value.filter((todo) => todo.id !== id)
}

const completeFilteredTodos = () => {
  filteredTodos.value.forEach((todo) => {
    todo.completed = true
  })
}

const clearCompletedTodos = async () => {
  if (isUsingSqlite.value) {
    await deleteCompletedTodosFromSqlite()
    refreshTodosFromSqlite()
    return
  }

  todos.value = todos.value.filter((todo) => !todo.completed)
}

const resetFilters = () => {
  search.value = ''
  statusFilter.value = 'all'
  priorityFilter.value = 'all'
  categoryFilter.value = 'all'
  hideCompleted.value = false
}

onMounted(async () => {
  if (import.meta.env.MODE === 'test') {
    todos.value = defaultTodos()
    dataSourceLabel.value = 'Seed data'
    isUsingSqlite.value = false
    isLoadingTodos.value = false
    return
  }

  try {
    await initializeTodoDatabase(defaultTodos())
    refreshTodosFromSqlite()
    dataSourceLabel.value = 'Persistent browser SQLite'
    isUsingSqlite.value = true
  } catch {
    todos.value = defaultTodos()
    dataSourceLabel.value = 'Seed data'
    isUsingSqlite.value = false
  }

  isLoadingTodos.value = false
})
</script>

<template>
  <main class="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
    <div class="mx-auto grid max-w-7xl gap-5">
      <TodoHeader
        :total-count="todos.length"
        :active-count="activeTodos.length"
        :completed-count="completedTodos.length"
        :overdue-count="overdueTodos.length"
      />

      <div class="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
        Data source: <span class="font-semibold text-slate-900">{{ dataSourceLabel }}</span>
      </div>

      <div
        v-if="isLoadingTodos"
        class="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600"
      >
        Loading TODOs from SQLite...
      </div>

      <section class="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside class="rounded-lg border border-slate-200 bg-white p-5">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-bold uppercase text-slate-500">Create</p>
              <h2 class="mt-1 text-xl font-bold">New TODO</h2>
            </div>
            <Plus class="text-slate-500" :size="22" />
          </div>

          <TodoForm
            :categories="categories"
            :priorities="priorities"
            :default-due-date="today"
            @add-todo="addTodo"
          />

          <CategorySummary :categories="categoryCounts" />
        </aside>

        <TodoList
          v-model:search="search"
          v-model:status-filter="statusFilter"
          v-model:priority-filter="priorityFilter"
          v-model:category-filter="categoryFilter"
          v-model:hide-completed="hideCompleted"
          :todos="filteredTodos"
          :total-count="todos.length"
          :high-priority-count="highPriorityTodos.length"
          :today="today"
          :categories="categories"
          @toggle-todo="toggleTodo"
          @delete-todo="deleteTodo"
          @complete-filtered-todos="completeFilteredTodos"
          @clear-completed-todos="clearCompletedTodos"
          @reset-filters="resetFilters"
        />
      </section>
    </div>
  </main>
</template>
