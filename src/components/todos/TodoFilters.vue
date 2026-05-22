<script setup lang="ts">
import { Search, X } from 'lucide-vue-next'
import type { Priority, StatusFilter } from '@/types/todo'

defineProps<{
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
  resetFilters: []
}>()
</script>

<template>
  <div class="mt-5 grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-4">
    <label class="relative block">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="17" />
      <input
        :value="search"
        class="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
        placeholder="Search title, description, or category"
        @input="emit('update:search', ($event.target as HTMLInputElement).value)"
      />
    </label>

    <div class="grid gap-3 xl:grid-cols-[1fr_160px_160px]">
      <div class="grid h-10 grid-cols-3 rounded-md border border-slate-300 bg-white p-1">
        <button
          type="button"
          class="rounded text-sm font-semibold"
          :class="{ 'bg-slate-950 text-white': statusFilter === 'all' }"
          @click="emit('update:statusFilter', 'all')"
        >
          All
        </button>
        <button
          type="button"
          class="rounded text-sm font-semibold"
          :class="{ 'bg-slate-950 text-white': statusFilter === 'active' }"
          @click="emit('update:statusFilter', 'active')"
        >
          Active
        </button>
        <button
          type="button"
          class="rounded text-sm font-semibold"
          :class="{ 'bg-slate-950 text-white': statusFilter === 'completed' }"
          @click="emit('update:statusFilter', 'completed')"
        >
          Done
        </button>
      </div>

      <select
        :value="priorityFilter"
        class="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
        @change="emit('update:priorityFilter', ($event.target as HTMLSelectElement).value as 'all' | Priority)"
      >
        <option value="all">All priorities</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>

      <select
        :value="categoryFilter"
        class="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
        @change="emit('update:categoryFilter', ($event.target as HTMLSelectElement).value)"
      >
        <option value="all">All categories</option>
        <option v-for="item in categories" :key="item" :value="item">
          {{ item }}
        </option>
      </select>
    </div>

    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <label class="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
        <input
          :checked="hideCompleted"
          class="size-4 accent-slate-950"
          type="checkbox"
          @change="emit('update:hideCompleted', ($event.target as HTMLInputElement).checked)"
        />
        Hide completed
      </label>

      <button
        class="inline-flex items-center gap-1 text-sm font-semibold text-slate-700"
        type="button"
        @click="emit('resetFilters')"
      >
        <X :size="15" />
        Reset filters
      </button>
    </div>
  </div>
</template>
