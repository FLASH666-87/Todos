<script setup lang="ts">
defineProps<{
  totalCount: number
  activeCount: number
  completedCount: number
  overdueCount: number
}>()
</script>

<template>
  <header class="rounded-lg border border-slate-200 bg-white p-5">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p class="text-sm font-semibold text-slate-500">Vue TODO course</p>
        <h1 class="mt-1 text-3xl font-bold tracking-normal text-slate-950">TODOs</h1>
        <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          This version keeps state in App.vue, but moves focused UI responsibilities into
          components.
        </p>
      </div>

      <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div class="rounded-md border border-slate-200 bg-slate-50 p-3">
          <p class="text-xs font-semibold text-slate-500">Total</p>
          <strong class="mt-1 block text-2xl">{{ totalCount }}</strong>
        </div>
        <div class="rounded-md border border-slate-200 bg-slate-50 p-3">
          <p class="text-xs font-semibold text-slate-500">Active</p>
          <strong class="mt-1 block text-2xl">{{ activeCount }}</strong>
        </div>
        <div class="rounded-md border border-slate-200 bg-slate-50 p-3">
          <p class="text-xs font-semibold text-slate-500">Done</p>
          <strong class="mt-1 block text-2xl">{{ completedCount }}</strong>
        </div>
        <div class="rounded-md border border-slate-200 bg-slate-50 p-3">
          <p class="text-xs font-semibold text-slate-500">Overdue</p>
          <strong class="mt-1 block text-2xl">{{ overdueCount }}</strong>
        </div>
      </div>
    </div>
  </header>
</template>
