<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  CalendarDays,
  Check,
  CheckCircle2,
  Circle,
  ClipboardList,
  Filter,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-vue-next'

type Priority = 'low' | 'medium' | 'high'
type StatusFilter = 'all' | 'active' | 'completed'

type Todo = {
  id: number
  title: string
  description: string
  completed: boolean
  priority: Priority
  category: string
  dueDate: string
  createdAt: string
}

const today = new Date().toISOString().slice(0, 10)

const title = ref('')
const description = ref('')
const priority = ref<Priority>('medium')
const category = ref('Course')
const dueDate = ref(today)
const search = ref('')
const statusFilter = ref<StatusFilter>('all')
const priorityFilter = ref<'all' | Priority>('all')
const categoryFilter = ref('all')
const hideCompleted = ref(false)

const todos = ref<Todo[]>([
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
])

const categories = ['Course', 'Teaching', 'Homework', 'Review', 'Personal']
const priorities: Array<{ value: Priority; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

const trimmedTitle = computed(() => title.value.trim())
const trimmedDescription = computed(() => description.value.trim())
const titleCharactersLeft = computed(() => 60 - title.value.length)
const descriptionCharactersLeft = computed(() => 160 - description.value.length)
const isTitleTouched = computed(() => title.value.length > 0)
const isTitleTooShort = computed(() => isTitleTouched.value && trimmedTitle.value.length < 3)
const isTitleTooLong = computed(() => titleCharactersLeft.value < 0)
const isDescriptionTooLong = computed(() => descriptionCharactersLeft.value < 0)
const canSubmit = computed(() => {
  return trimmedTitle.value.length >= 3 && !isTitleTooLong.value && !isDescriptionTooLong.value
})

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

const addTodo = () => {
  if (!canSubmit.value) return

  todos.value.push({
    id: Date.now(),
    title: trimmedTitle.value,
    description: trimmedDescription.value || 'No description.',
    completed: false,
    priority: priority.value,
    category: category.value,
    dueDate: dueDate.value,
    createdAt: today,
  })

  title.value = ''
  description.value = ''
  priority.value = 'medium'
  category.value = 'Course'
  dueDate.value = today
}

const toggleTodo = (id: number) => {
  const todo = todos.value.find((item) => item.id === id)
  if (!todo) return

  todo.completed = !todo.completed
}

const deleteTodo = (id: number) => {
  todos.value = todos.value.filter((todo) => todo.id !== id)
}

const completeFilteredTodos = () => {
  filteredTodos.value.forEach((todo) => {
    todo.completed = true
  })
}

const clearCompletedTodos = () => {
  todos.value = todos.value.filter((todo) => !todo.completed)
}

const resetFilters = () => {
  search.value = ''
  statusFilter.value = 'all'
  priorityFilter.value = 'all'
  categoryFilter.value = 'all'
  hideCompleted.value = false
}

const priorityClass = (value: Priority) => {
  if (value === 'high') return 'border-red-200 bg-red-50 text-red-700'
  if (value === 'medium') return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
}

const dueState = (todo: Todo) => {
  if (todo.completed) return 'Done'
  if (todo.dueDate < today) return 'Overdue'
  if (todo.dueDate === today) return 'Today'
  return 'Upcoming'
}
</script>

<template>
  <main class="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
    <div class="mx-auto grid max-w-7xl gap-5">
      <header class="rounded-lg border border-slate-200 bg-white p-5">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p class="text-sm font-semibold text-slate-500">Vue TODO course</p>
            <h1 class="mt-1 text-3xl font-bold tracking-normal text-slate-950">TODOs</h1>
            <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              This version keeps everything in App.vue on purpose, so the file becomes realistic
              enough to discuss component boundaries.
            </p>
          </div>

          <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div class="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p class="text-xs font-semibold text-slate-500">Total</p>
              <strong class="mt-1 block text-2xl">{{ todos.length }}</strong>
            </div>
            <div class="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p class="text-xs font-semibold text-slate-500">Active</p>
              <strong class="mt-1 block text-2xl">{{ activeTodos.length }}</strong>
            </div>
            <div class="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p class="text-xs font-semibold text-slate-500">Done</p>
              <strong class="mt-1 block text-2xl">{{ completedTodos.length }}</strong>
            </div>
            <div class="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p class="text-xs font-semibold text-slate-500">Overdue</p>
              <strong class="mt-1 block text-2xl">{{ overdueTodos.length }}</strong>
            </div>
          </div>
        </div>
      </header>

      <section class="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside class="rounded-lg border border-slate-200 bg-white p-5">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-bold uppercase text-slate-500">Create</p>
              <h2 class="mt-1 text-xl font-bold">New TODO</h2>
            </div>
            <Plus class="text-slate-500" :size="22" />
          </div>

          <form class="mt-5 grid gap-4" @submit.prevent="addTodo">
            <label class="grid gap-2">
              <span class="text-sm font-semibold text-slate-700">Title</span>
              <input
                v-model="title"
                class="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                placeholder="Write down a task"
                @keydown.enter.prevent="addTodo"
              />
            </label>

            <div class="flex min-h-5 justify-between gap-3 text-xs text-slate-500">
              <span :class="{ 'font-semibold text-red-600': isTitleTooLong }">
                {{ titleCharactersLeft }} characters left
              </span>
              <span v-if="isTitleTooShort" class="font-semibold text-red-600">
                Use at least 3 characters.
              </span>
            </div>

            <label class="grid gap-2">
              <span class="text-sm font-semibold text-slate-700">Description</span>
              <textarea
                v-model="description"
                class="min-h-28 rounded-md border border-slate-300 bg-white p-3 text-sm leading-6 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                placeholder="Add notes for this task"
              />
            </label>

            <div class="flex min-h-5 justify-between gap-3 text-xs text-slate-500">
              <span :class="{ 'font-semibold text-red-600': isDescriptionTooLong }">
                {{ descriptionCharactersLeft }} characters left
              </span>
              <span v-if="isDescriptionTooLong" class="font-semibold text-red-600">
                Description is too long.
              </span>
            </div>

            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <label class="grid gap-2">
                <span class="text-sm font-semibold text-slate-700">Category</span>
                <select
                  v-model="category"
                  class="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                >
                  <option v-for="item in categories" :key="item" :value="item">
                    {{ item }}
                  </option>
                </select>
              </label>

              <label class="grid gap-2">
                <span class="text-sm font-semibold text-slate-700">Due date</span>
                <input
                  v-model="dueDate"
                  class="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                  type="date"
                />
              </label>
            </div>

            <div class="grid gap-2">
              <span class="text-sm font-semibold text-slate-700">Priority</span>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="item in priorities"
                  :key="item.value"
                  type="button"
                  class="rounded-md border px-3 py-2 text-sm font-semibold"
                  :class="
                    priority === item.value
                      ? priorityClass(item.value)
                      : 'border-slate-200 bg-white text-slate-600'
                  "
                  @click="priority = item.value"
                >
                  {{ item.label }}
                </button>
              </div>
            </div>

            <button
              class="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
              type="submit"
              :disabled="!canSubmit"
            >
              <Plus :size="16" />
              Add TODO
            </button>
          </form>

          <div class="mt-6 border-t border-slate-200 pt-5">
            <div class="flex items-center gap-2">
              <ClipboardList class="text-slate-500" :size="18" />
              <h3 class="text-sm font-bold">Category summary</h3>
            </div>

            <ul class="mt-3 grid gap-2">
              <li
                v-for="item in categoryCounts"
                :key="item.name"
                class="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm"
              >
                <span class="font-medium text-slate-700">{{ item.name }}</span>
                <span class="text-slate-500">{{ item.active }} active / {{ item.total }} total</span>
              </li>
            </ul>
          </div>
        </aside>

        <section class="grid gap-4">
          <div class="rounded-lg border border-slate-200 bg-white p-5">
            <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p class="text-xs font-bold uppercase text-slate-500">Manage</p>
                <h2 class="mt-1 text-xl font-bold">TODO list</h2>
              </div>

              <div class="flex flex-col gap-2 sm:flex-row">
                <button
                  class="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold"
                  type="button"
                  @click="completeFilteredTodos"
                >
                  <Check :size="16" />
                  Complete filtered
                </button>
                <button
                  class="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-red-200 bg-white px-3 text-sm font-semibold text-red-700"
                  type="button"
                  @click="clearCompletedTodos"
                >
                  <Trash2 :size="16" />
                  Clear completed
                </button>
              </div>
            </div>

            <div class="mt-5 grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-4">
              <label class="relative block">
                <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="17" />
                <input
                  v-model="search"
                  class="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                  placeholder="Search title, description, or category"
                />
              </label>

              <div class="grid gap-3 xl:grid-cols-[1fr_160px_160px]">
                <div class="grid h-10 grid-cols-3 rounded-md border border-slate-300 bg-white p-1">
                  <button
                    type="button"
                    class="rounded text-sm font-semibold"
                    :class="{ 'bg-slate-950 text-white': statusFilter === 'all' }"
                    @click="statusFilter = 'all'"
                  >
                    All
                  </button>
                  <button
                    type="button"
                    class="rounded text-sm font-semibold"
                    :class="{ 'bg-slate-950 text-white': statusFilter === 'active' }"
                    @click="statusFilter = 'active'"
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    class="rounded text-sm font-semibold"
                    :class="{ 'bg-slate-950 text-white': statusFilter === 'completed' }"
                    @click="statusFilter = 'completed'"
                  >
                    Done
                  </button>
                </div>

                <select
                  v-model="priorityFilter"
                  class="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                >
                  <option value="all">All priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>

                <select
                  v-model="categoryFilter"
                  class="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                >
                  <option value="all">All categories</option>
                  <option v-for="item in categories" :key="item" :value="item">
                    {{ item }}
                  </option>
                </select>
              </div>

              <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label class="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input v-model="hideCompleted" class="size-4 accent-slate-950" type="checkbox" />
                  Hide completed
                </label>

                <button
                  class="inline-flex items-center gap-1 text-sm font-semibold text-slate-700"
                  type="button"
                  @click="resetFilters"
                >
                  <X :size="15" />
                  Reset filters
                </button>
              </div>
            </div>
          </div>

          <div class="rounded-lg border border-slate-200 bg-white p-5">
            <div class="mb-4 flex items-center justify-between gap-3">
              <div class="inline-flex items-center gap-2 text-sm text-slate-600">
                <Filter :size="16" />
                Showing {{ filteredTodos.length }} of {{ todos.length }}
              </div>
              <div class="text-sm text-slate-500">
                {{ highPriorityTodos.length }} high priority
              </div>
            </div>

            <ul v-if="filteredTodos.length" class="grid gap-3">
              <li
                v-for="todo in filteredTodos"
                :key="todo.id"
                class="grid gap-3 rounded-md border border-slate-200 p-4 sm:grid-cols-[40px_minmax(0,1fr)_40px]"
                :class="{ 'bg-slate-50': todo.completed }"
              >
                <button
                  type="button"
                  class="grid size-10 place-items-center rounded-md border border-slate-300 bg-white"
                  :aria-label="todo.completed ? 'Mark active' : 'Mark completed'"
                  @click="toggleTodo(todo.id)"
                >
                  <CheckCircle2 v-if="todo.completed" class="text-emerald-600" :size="21" />
                  <Circle v-else class="text-slate-500" :size="21" />
                </button>

                <div class="min-w-0">
                  <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <h3
                      class="text-base font-semibold leading-6"
                      :class="{ 'text-slate-400 line-through': todo.completed }"
                    >
                      {{ todo.title }}
                    </h3>

                    <span
                      class="inline-flex w-fit rounded-full border px-2 py-1 text-xs font-semibold"
                      :class="priorityClass(todo.priority)"
                    >
                      {{ todo.priority }}
                    </span>
                  </div>

                  <p
                    class="mt-2 text-sm leading-6 text-slate-600"
                    :class="{ 'text-slate-400 line-through': todo.completed }"
                  >
                    {{ todo.description }}
                  </p>

                  <div class="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                    <span class="rounded-full bg-slate-100 px-2 py-1 font-medium">
                      {{ todo.category }}
                    </span>
                    <span class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 font-medium">
                      <CalendarDays :size="13" />
                      {{ todo.dueDate }}
                    </span>
                    <span
                      class="rounded-full px-2 py-1 font-medium"
                      :class="
                        dueState(todo) === 'Overdue'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-slate-100 text-slate-600'
                      "
                    >
                      {{ dueState(todo) }}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  class="grid size-10 place-items-center rounded-md border border-red-200 bg-white text-red-700"
                  aria-label="Delete TODO"
                  @click="deleteTodo(todo.id)"
                >
                  <Trash2 :size="17" />
                </button>
              </li>
            </ul>

            <div v-else class="grid min-h-60 place-items-center rounded-md border border-dashed border-slate-300">
              <div class="p-6 text-center">
                <ClipboardList class="mx-auto text-slate-400" :size="38" />
                <h3 class="mt-3 text-base font-semibold">No TODOs match these filters</h3>
                <p class="mt-1 text-sm text-slate-500">Reset filters or add a new TODO.</p>
                <button
                  class="mt-4 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold"
                  type="button"
                  @click="resetFilters"
                >
                  Reset filters
                </button>
              </div>
            </div>
          </div>
        </section>
      </section>
    </div>
  </main>
</template>
