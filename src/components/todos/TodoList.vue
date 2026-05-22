<script setup lang="ts">
import { Check, ClipboardList, Filter, Trash2 } from 'lucide-vue-next'
import type { Todo } from '@/types/todo'
import TodoFilters from './TodoFilters.vue'
import TodoItem from './TodoItem.vue'
import type { Priority, StatusFilter } from '@/types/todo'

defineProps<{
  todos: Todo[]
  totalCount: number
  highPriorityCount: number
  today: string
  search: string
  statusFilter: StatusFilter
  priorityFilter: 'all' | Priority
  categoryFilter: string
  hideCompleted: boolean
  categories: string[]
}>()

const emit = defineEmits<{
  'update:search': [value: string]
  'update:statusFilter': [value: StatusFilter]
  'update:priorityFilter': [value: 'all' | Priority]
  'update:categoryFilter': [value: string]
  'update:hideCompleted': [value: boolean]
  toggleTodo: [id: number]
  deleteTodo: [id: number]
  completeFilteredTodos: []
  clearCompletedTodos: []
  resetFilters: []
}>()
</script>

<template>
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
            @click="emit('completeFilteredTodos')"
          >
            <Check :size="16" />
            Complete filtered
          </button>
          <button
            class="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-red-200 bg-white px-3 text-sm font-semibold text-red-700"
            type="button"
            @click="emit('clearCompletedTodos')"
          >
            <Trash2 :size="16" />
            Clear completed
          </button>
        </div>
      </div>

      <TodoFilters
        :search="search"
        :status-filter="statusFilter"
        :priority-filter="priorityFilter"
        :category-filter="categoryFilter"
        :hide-completed="hideCompleted"
        :categories="categories"
        @update:search="emit('update:search', $event)"
        @update:status-filter="emit('update:statusFilter', $event)"
        @update:priority-filter="emit('update:priorityFilter', $event)"
        @update:category-filter="emit('update:categoryFilter', $event)"
        @update:hide-completed="emit('update:hideCompleted', $event)"
        @reset-filters="emit('resetFilters')"
      />
    </div>

    <div class="rounded-lg border border-slate-200 bg-white p-5">
      <div class="mb-4 flex items-center justify-between gap-3">
        <div class="inline-flex items-center gap-2 text-sm text-slate-600">
          <Filter :size="16" />
          Showing {{ todos.length }} of {{ totalCount }}
        </div>
        <div class="text-sm text-slate-500">{{ highPriorityCount }} high priority</div>
      </div>

      <ul v-if="todos.length" class="grid gap-3">
        <TodoItem
          v-for="todo in todos"
          :key="todo.id"
          :todo="todo"
          :today="today"
          @toggle-todo="emit('toggleTodo', $event)"
          @delete-todo="emit('deleteTodo', $event)"
        />
      </ul>

      <div v-else class="grid min-h-60 place-items-center rounded-md border border-dashed border-slate-300">
        <div class="p-6 text-center">
          <ClipboardList class="mx-auto text-slate-400" :size="38" />
          <h3 class="mt-3 text-base font-semibold">No TODOs match these filters</h3>
          <p class="mt-1 text-sm text-slate-500">Reset filters or add a new TODO.</p>
          <button
            class="mt-4 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold"
            type="button"
            @click="emit('resetFilters')"
          >
            Reset filters
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
