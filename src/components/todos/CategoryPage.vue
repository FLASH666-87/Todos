<script setup lang="ts">
import { computed } from 'vue'
import { ArrowLeft } from 'lucide-vue-next'
import type { Todo } from '@/types/todo'
import TreeView from './TreeView.vue'
import type { TreeNode } from './TreeView.vue'

const props = defineProps<{
  todos: Todo[]
  categories: string[]
  title?: string
}>()

const emit = defineEmits<{
  back: []
}>()

const pageTitle = computed(() => props.title ?? '分類魚骨視圖')

function buildCategoryTree(category: string): TreeNode[] {
  const catTodos = props.todos.filter((t) => t.category === category)
  const catIdSet = new Set(catTodos.map((t) => t.id))

  const childrenMap = new Map<number | null, Todo[]>()
  for (const todo of catTodos) {
    const p = todo.parentId
    if (!childrenMap.has(p)) childrenMap.set(p, [])
    childrenMap.get(p)!.push(todo)
  }
  for (const [, children] of childrenMap) {
    children.sort((a, b) => a.id - b.id)
  }

  const buildNode = (todo: Todo): TreeNode => ({
    todo,
    number: '',
    children: (childrenMap.get(todo.id) ?? []).map(buildNode),
  })

  const assignNumber = (node: TreeNode, prefix: string) => {
    node.number = prefix
    node.children.forEach((child, idx) => {
      assignNumber(child, prefix + '.' + (idx + 1))
    })
  }

  const roots = catTodos.filter(
    (t) => t.parentId === null || !catIdSet.has(t.parentId),
  )
  roots.sort((a, b) => a.id - b.id)

  const tree = roots.map(buildNode)
  tree.forEach((node, idx) => assignNumber(node, String(idx + 1)))
  return tree
}

const categoryGroups = computed(() => {
  return props.categories.map((name) => {
    const items = props.todos.filter((t) => t.category === name)
    return {
      name,
      active: items.filter((t) => !t.completed).length,
      total: items.length,
      roots: buildCategoryTree(name),
    }
  })
})
</script>

<template>
  <div class="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-7xl">
      <div class="mb-6 flex items-center justify-between">
        <h1 class="text-xl font-bold">{{ pageTitle }}</h1>
        <button
          class="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          @click="emit('back')"
        >
          <ArrowLeft :size="16" />
          回到列表
        </button>
      </div>

      <div class="grid gap-6">
        <div
          v-for="group in categoryGroups"
          :key="group.name"
          class="rounded-lg border border-slate-200 bg-white p-5"
        >
          <div class="mb-4 flex items-baseline gap-2 border-b border-slate-100 pb-3">
            <h2 class="text-base font-bold text-slate-800">{{ group.name }}</h2>
            <span class="text-sm text-slate-500">
              {{ group.active }} active / {{ group.total }} total
            </span>
          </div>

          <div
            v-if="group.roots.length === 0"
            class="rounded-lg border border-dashed border-slate-300 bg-white/50 px-4 py-6 text-center text-sm text-slate-400"
          >
            No items
          </div>

          <ul v-else>
            <TreeView
              v-for="(root, idx) in group.roots"
              :key="root.todo.id"
              :node="root"
              :is-last="idx === group.roots.length - 1"
            />
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
