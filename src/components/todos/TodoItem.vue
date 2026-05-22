<script setup lang="ts">
import { CalendarDays, CheckCircle2, Circle, Trash2 } from 'lucide-vue-next'
import type { Priority, Todo } from '@/types/todo'

const props = defineProps<{
  todo: Todo
  today: string
}>()

const emit = defineEmits<{
  toggleTodo: [id: number]
  deleteTodo: [id: number]
}>()

const priorityClass = (value: Priority) => {
  if (value === 'high') return 'border-red-200 bg-red-50 text-red-700'
  if (value === 'medium') return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
}

const dueState = (todo: Todo) => {
  if (todo.completed) return 'Done'
  if (todo.dueDate < props.today) return 'Overdue'
  if (todo.dueDate === props.today) return 'Today'
  return 'Upcoming'
}
</script>

<template>
  <li
    class="grid gap-3 rounded-md border border-slate-200 p-4 sm:grid-cols-[40px_minmax(0,1fr)_40px]"
    :class="{ 'bg-slate-50': todo.completed }"
  >
    <button
      type="button"
      class="grid size-10 place-items-center rounded-md border border-slate-300 bg-white"
      :aria-label="todo.completed ? 'Mark active' : 'Mark completed'"
      @click="emit('toggleTodo', todo.id)"
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
            dueState(todo) === 'Overdue' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
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
      @click="emit('deleteTodo', todo.id)"
    >
      <Trash2 :size="17" />
    </button>
  </li>
</template>
