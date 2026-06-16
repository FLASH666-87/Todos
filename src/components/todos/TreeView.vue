<script lang="ts">
export default { name: 'TreeView' }
</script>

<script setup lang="ts">
import type { Todo } from '@/types/todo'

export interface TreeNode {
  todo: Todo
  number: string
  children: TreeNode[]
}

defineProps<{
  node: TreeNode
  isLast: boolean
}>()
</script>

<template>
  <li class="relative pl-6">
    <span
      class="absolute left-3 top-0 w-0.5 bg-slate-300"
      :class="isLast ? 'h-3' : 'bottom-0'"
    />
    <span class="absolute left-3 top-3 h-0.5 w-3 bg-slate-300" />
    <div class="py-0.5">
      <div class="flex items-center gap-1.5">
        <span class="min-w-[2.5rem] text-xs font-medium text-slate-500">{{ node.number }}</span>
        <span
          class="truncate"
          :class="node.todo.completed ? 'text-slate-400 line-through' : 'text-slate-700'"
        >
          {{ node.todo.title }}
        </span>
      </div>
      <div class="ml-[2.5rem] mt-0.5 text-xs text-slate-400 line-clamp-2">
        {{ node.todo.description }}
      </div>
    </div>
    <ul v-if="node.children.length">
      <TreeView
        v-for="(child, idx) in node.children"
        :key="child.todo.id"
        :node="child"
        :is-last="idx === node.children.length - 1"
      />
    </ul>
  </li>
</template>
