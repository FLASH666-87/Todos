<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { LogOut, Plus } from 'lucide-vue-next'
import CategoryPage from '@/components/todos/CategoryPage.vue'
import CategorySummary from '@/components/todos/CategorySummary.vue'
import TodoForm from '@/components/todos/TodoForm.vue'
import TodoHeader from '@/components/todos/TodoHeader.vue'
import TodoList from '@/components/todos/TodoList.vue'
import type { User } from 'firebase/auth'
import {
  addTodos,
  clearCompletedTodos,
  completeFilteredTodos,
  deleteTodo as fbDeleteTodo,
  login as fbLogin,
  logout as fbLogout,
  onAuthChange,
  resolveRedirectResult,
  subscribeTodos,
  toggleTodo as fbToggleTodo,
} from '@/lib/firebase'
import { buildNumberedTree, resolveChain } from '@/lib/utils'
import type { Priority, PriorityOption, StatusFilter, Todo, TodoDraft } from '@/types/todo'

const today = new Date().toISOString().slice(0, 10)

const search = ref('')
const statusFilter = ref<StatusFilter>('all')
const priorityFilter = ref<'all' | Priority>('all')
const categoryFilter = ref('all')
const hideCompleted = ref(false)
const currentView = ref<'list' | 'category' | 'app-dev'>('list')
const todos = ref<Todo[]>([])
const user = ref<User | null>(null)

const isLoggedIn = computed(() => user.value !== null)

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

const addTodo = async (draft: TodoDraft, numberLabel: string) => {
  const categoryTodos = todos.value.filter((t) => t.category === draft.category)
  const chain = resolveChain(numberLabel, categoryTodos, draft, today)
  await addTodos(chain)
}

const toggleTodo = async (id: number) => {
  const todo = todos.value.find((item) => item.id === id)
  if (!todo) return
  await fbToggleTodo(id, !todo.completed)
}

const deleteTodo = async (id: number) => {
  await fbDeleteTodo(id)
}

const completeAllFiltered = () => {
  const ids = filteredTodos.value.filter((t) => !t.completed).map((t) => t.id)
  if (ids.length > 0) completeFilteredTodos(ids)
}

const clearAllCompleted = () => {
  clearCompletedTodos()
}

const resetFilters = () => {
  search.value = ''
  statusFilter.value = 'all'
  priorityFilter.value = 'all'
  categoryFilter.value = 'all'
  hideCompleted.value = false
}

let unsubscribeTodos: (() => void) | null = null
let unsubscribeAuth: (() => void) | null = null

const handleLogin = async () => {
  try {
    const result = await fbLogin()
    if (result === 'popup-blocked') {
      alert('Popup was blocked. Please allow popups for this site and try again.')
    }
  } catch (e) {
    console.error('Login error:', e)
    alert('Login failed. Please check:\n1. Google sign-in is enabled in Firebase Console (Authentication → Sign-in method)\n2. flash666-87.github.io is in Authorized domains (Authentication → Settings)')
  }
}

const handleLogout = async () => {
  await fbLogout()
}

onMounted(() => {
  resolveRedirectResult()

  unsubscribeAuth = onAuthChange((fbUser) => {
    user.value = fbUser

    if (fbUser && !unsubscribeTodos) {
      unsubscribeTodos = subscribeTodos(
        (fbTodos) => {
          todos.value = fbTodos
        },
        () => {
          handleLogout()
          alert('Your Google account is not authorized to access this app.')
        },
      )
    }

    if (!fbUser && unsubscribeTodos) {
      unsubscribeTodos()
      unsubscribeTodos = null
      todos.value = []
    }
  })
})
</script>

<template>
  <div v-if="!isLoggedIn" class="grid min-h-screen place-items-center bg-slate-100 px-4">
    <div class="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 text-center">
      <h1 class="text-2xl font-bold text-slate-900">TODO App</h1>
      <p class="mt-2 text-sm text-slate-500">Sign in with Google to continue</p>
      <button
        class="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98]"
        @click="handleLogin"
      >
        <svg class="size-5" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Sign in with Google
      </button>
    </div>
  </div>

  <main v-else class="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
    <div class="mx-auto grid max-w-7xl gap-5">
      <TodoHeader
        :total-count="todos.length"
        :active-count="activeTodos.length"
        :completed-count="completedTodos.length"
        :overdue-count="overdueTodos.length"
      />

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

          <div class="mt-4 flex items-center gap-3 border-t border-slate-200 pt-4">
            <img
              v-if="user?.photoURL"
              :src="user.photoURL"
              class="size-8 rounded-full"
              :alt="user.displayName ?? ''"
            />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold text-slate-900">{{ user?.displayName }}</p>
              <p class="truncate text-xs text-slate-500">{{ user?.email }}</p>
            </div>
            <button
              class="inline-flex size-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50"
              :title="'Sign out'"
              @click="handleLogout"
            >
              <LogOut :size="15" />
            </button>
          </div>
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
          @complete-filtered-todos="completeAllFiltered"
          @clear-completed-todos="clearAllCompleted"
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