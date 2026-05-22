<script setup lang="ts">
import { ClipboardList } from 'lucide-vue-next'
import type { CategoryCount } from '@/types/todo'

defineProps<{
  categories: CategoryCount[]
}>()
</script>

<template>
  <div class="mt-6 border-t border-slate-200 pt-5">
    <div class="flex items-center gap-2">
      <ClipboardList class="text-slate-500" :size="18" />
      <h3 class="text-sm font-bold">Category summary</h3>
    </div>

    <ul class="mt-3 grid gap-2">
      <li
        v-for="item in categories"
        :key="item.name"
        class="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm"
      >
        <span class="font-medium text-slate-700">{{ item.name }}</span>
        <span class="text-slate-500">{{ item.active }} active / {{ item.total }} total</span>
      </li>
    </ul>
  </div>
</template>
