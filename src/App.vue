<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Plus } from 'lucide-vue-next'
import CategoryPage from '@/components/todos/CategoryPage.vue'
import CategorySummary from '@/components/todos/CategorySummary.vue'
import TodoForm from '@/components/todos/TodoForm.vue'
import TodoHeader from '@/components/todos/TodoHeader.vue'
import TodoList from '@/components/todos/TodoList.vue'
import {
  deleteCompletedTodosFromSqlite,
  deleteTodoFromSqlite,
  initializeTodoDatabase,
  insertTodosIntoSqlite,
  listTodosFromSqlite,
  updateTodoCompletedInSqlite,
} from '@/lib/todoSqlite'
import { loadTodosFromDisk, saveTodosToDisk } from '@/lib/fileSync'
import { buildNumberedTree, resolveChain } from '@/lib/utils'
import type { Priority, PriorityOption, StatusFilter, Todo, TodoDraft } from '@/types/todo'

const today = new Date().toISOString().slice(0, 10)

const search = ref('')
const statusFilter = ref<StatusFilter>('all')
const priorityFilter = ref<'all' | Priority>('all')
const categoryFilter = ref('all')
const hideCompleted = ref(false)
const currentView = ref<'list' | 'category' | 'app-dev'>('list')
const isLoadingTodos = ref(true)
const dataSourceLabel = ref('Browser SQLite')
const isUsingSqlite = ref(false)
const todos = ref<Todo[]>([])

const categories = ['App Dev', 'App Core Issue', 'Bug', 'App Feature', 'Minor Task']
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

const parentIds = computed(() => {
  const ids = new Set<number>()
  todos.value.forEach((todo) => {
    if (todo.parentId !== null) ids.add(todo.parentId)
  })
  return ids
})

const todoNumbers = computed(() => {
  const result: Record<number, string> = {}
  const cats = [...new Set(todos.value.map((t) => t.category))]
  for (const cat of cats) {
    const map = buildNumberedTree(todos.value.filter((t) => t.category === cat))
    map.forEach((value, key) => { result[key] = value })
  }
  return result
})

const refreshTodosFromSqlite = () => {
  todos.value = listTodosFromSqlite()
}

const addTodo = async (draft: TodoDraft, numberLabel: string) => {
  const categoryTodos = todos.value.filter((t) => t.category === draft.category)
  const chain = resolveChain(numberLabel, categoryTodos, draft, today)

  if (isUsingSqlite.value) {
    await insertTodosIntoSqlite(chain)
    refreshTodosFromSqlite()
    return
  }

  chain.forEach((todo) => todos.value.push(todo))
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

  const deleted = todos.value.find((t) => t.id === id)
  if (deleted) {
    todos.value.forEach((todo) => {
      if (todo.parentId === id) todo.parentId = deleted.parentId
    })
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
    todos.value = []
    dataSourceLabel.value = 'Seed data'
    isUsingSqlite.value = false
    isLoadingTodos.value = false
    return
  }

  try {
    await initializeTodoDatabase([])
    refreshTodosFromSqlite()
    dataSourceLabel.value = 'Persistent browser SQLite'
    isUsingSqlite.value = true
  } catch {
    todos.value = []
    dataSourceLabel.value = 'Seed data'
    isUsingSqlite.value = false
  }

  isLoadingTodos.value = false

  loadTodosFromDisk().then((diskTodos) => {
    if (diskTodos && diskTodos.length > 0 && todos.value.length === 0) {
      todos.value = diskTodos
    }
  })
})

let saveTimer: ReturnType<typeof setTimeout> | undefined
watch(todos, (value) => {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveTodosToDisk(value)
  }, 1000)
}, { deep: true })
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

      <section v-if="currentView === 'list'" class="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
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
            :todos="todos"
            @add-todo="addTodo"
          />

          <button
            class="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            @click="currentView = 'app-dev'"
          >
            App Dev 魚骨視圖
          </button>

          <button
            class="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            @click="currentView = 'category'"
          >
            分類魚骨視圖
          </button>

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
          :todo-numbers="todoNumbers"
          :parent-ids="parentIds"
          @toggle-todo="toggleTodo"
          @delete-todo="deleteTodo"
          @complete-filtered-todos="completeFilteredTodos"
          @clear-completed-todos="clearCompletedTodos"
          @reset-filters="resetFilters"
        />
      </section>

      <CategoryPage
        v-else-if="currentView === 'app-dev'"
        title="App Dev 魚骨視圖"
        :categories="['App Dev']"
        :todos="todos"
        @back="currentView = 'list'"
      />

      <CategoryPage
        v-else
        title="分類魚骨視圖"
        :categories="['App Core Issue', 'Bug', 'App Feature', 'Minor Task']"
        :todos="todos"
        @back="currentView = 'list'"
      />
    </div>
  </main>
</template>
