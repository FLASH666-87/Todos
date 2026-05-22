<script setup lang="ts">
import { computed, ref } from 'vue'
import { Plus } from 'lucide-vue-next'
import type { Priority, PriorityOption, TodoDraft } from '@/types/todo'

const props = defineProps<{
  categories: string[]
  priorities: PriorityOption[]
  defaultDueDate: string
}>()

const emit = defineEmits<{
  addTodo: [todo: TodoDraft]
}>()

const title = ref('')
const description = ref('')
const priority = ref<Priority>('medium')
const category = ref('Course')
const dueDate = ref(props.defaultDueDate)

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

const priorityClass = (value: Priority) => {
  if (value === 'high') return 'border-red-200 bg-red-50 text-red-700'
  if (value === 'medium') return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
}

const resetForm = () => {
  title.value = ''
  description.value = ''
  priority.value = 'medium'
  category.value = 'Course'
  dueDate.value = props.defaultDueDate
}

const submit = () => {
  if (!canSubmit.value) return

  emit('addTodo', {
    title: trimmedTitle.value,
    description: trimmedDescription.value || 'No description.',
    priority: priority.value,
    category: category.value,
    dueDate: dueDate.value,
  })

  resetForm()
}
</script>

<template>
  <form class="mt-5 grid gap-4" @submit.prevent="submit">
    <label class="grid gap-2">
      <span class="text-sm font-semibold text-slate-700">Title</span>
      <input
        v-model="title"
        class="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
        placeholder="Write down a task"
        @keydown.enter.prevent="submit"
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
            priority === item.value ? priorityClass(item.value) : 'border-slate-200 bg-white text-slate-600'
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
</template>
