# 教學 03：讓 TODO state 在 refresh 後留下來

## 這一課要先讓學生看到問題

不要一開始就講 `localStorage`。

現在的 TODO App 已經拆成 components，但資料仍然放在 `App.vue`：

```ts
const todos = ref<Todo[]>([
  {
    id: 1,
    title: 'Learn Vue state and v-model',
    completed: false,
    // ...
  },
])
```

這代表 `todos` 是 JavaScript 執行中的記憶體資料。只要 refresh，整個 Vue app 會重新執行，`todos` 就會回到程式碼寫死的初始值。

課堂操作順序：

1. 新增一筆 TODO
2. 勾選一筆 TODO 完成
3. 刪除一筆 TODO
4. refresh
5. 觀察全部回到初始狀態

這時候再問學生：

> 我們剛剛做的操作，到底存在哪裡？

答案是：只存在瀏覽器頁面當下的記憶體裡。

## 這不是 component 的問題

這一點要特別講清楚。

拆 component 後，資料流變清楚了：

- `TodoForm` 負責表單輸入
- `TodoFilters` 負責篩選 UI
- `TodoList` 負責清單呈現
- `App.vue` 負責持有 `todos`

但資料還是會在 refresh 後消失。

所以這一課要帶出的概念是：

> Component 拆解解決的是程式結構問題，不會自動解決資料保存問題。

## 持久化是另一個責任

目前的 state 有三種層級：

| 資料 | 放哪裡 | 原因 |
| --- | --- | --- |
| 表單輸入中的 title | `TodoForm.vue` | 只有表單自己需要 |
| `todos` 清單 | `App.vue` | 多個元件都需要使用 |
| refresh 後還要存在的 todos | browser storage 或 server | 需要離開 Vue runtime 還存在 |

這裡可以先不要上後端，因為課程目標是前端 state。

先使用 `localStorage`，因為它能清楚展示：

- Vue state 是記憶體
- browser storage 是瀏覽器保存區
- refresh 時要重新載入資料
- state 改變時要同步保存

## localStorage 的限制要先講

`localStorage` 適合這個教學階段，但不是正式產品萬用解。

它的特性：

- 只能存字串
- 同一個瀏覽器、同一個 domain 才讀得到
- 清除瀏覽器資料會消失
- 不適合存敏感資料
- 不會跨裝置同步
- 多人共享資料仍然需要後端 API 和資料庫

所以教學話術可以是：

> 我們現在不是在做正式資料庫，而是在學「state 如何離開 Vue runtime 被保存」。

## 實作設計

持久化分成兩個動作：

1. App 啟動時，從 `localStorage` 讀資料
2. `todos` 改變時，把最新資料寫回 `localStorage`

## 第一步：把初始資料抽成 function

先不要直接把陣列塞進 `ref`。

```ts
const defaultTodos = (): Todo[] => [
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
]
```

這樣做的原因：

- 預設資料有名字
- 之後讀不到 storage 時可以 fallback
- `loadTodos` 比較乾淨

## 第二步：讀取 localStorage

```ts
const STORAGE_KEY = 'vue-todos'

const loadTodos = (): Todo[] => {
  const savedTodos = localStorage.getItem(STORAGE_KEY)

  if (!savedTodos) {
    return defaultTodos()
  }

  return JSON.parse(savedTodos)
}

const todos = ref<Todo[]>(loadTodos())
```

這裡要教兩件事：

`localStorage.getItem` 拿到的是 `string | null`。

`JSON.parse` 是把 JSON 字串轉回 array/object。

## 第三步：處理壞掉的資料

學生很容易忽略這件事，但這是真實專案會遇到的狀況。

localStorage 裡可能被手動改壞，或是舊版資料格式已經不符合新版程式。

所以要加 `try/catch`：

```ts
const loadTodos = (): Todo[] => {
  const savedTodos = localStorage.getItem(STORAGE_KEY)

  if (!savedTodos) {
    return defaultTodos()
  }

  try {
    return JSON.parse(savedTodos)
  } catch {
    return defaultTodos()
  }
}
```

教學重點：

> 只要資料來自程式外部，就不能假設它永遠是正確的。

## 第四步：用 watch 同步保存

現在 App 啟動時會讀資料，但新增、完成、刪除後還沒有寫回去。

```ts
watch(
  todos,
  (newTodos) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTodos))
  },
  { deep: true },
)
```

要解釋三件事：

`watch`：監聽 state 的變化。

`JSON.stringify`：把 array/object 轉成字串，因為 localStorage 只能存字串。

`deep: true`：我們會修改 `todo.completed` 這種巢狀資料，不只是整個替換 `todos.value`。

## 為什麼不在每個 method 裡手動 save？

可以比較兩種寫法。

不建議一開始這樣：

```ts
const addTodo = (draft: TodoDraft) => {
  todos.value.push(createTodo(draft))
  saveTodos()
}

const toggleTodo = (id: number) => {
  const todo = todos.value.find((item) => item.id === id)
  if (!todo) return

  todo.completed = !todo.completed
  saveTodos()
}

const deleteTodo = (id: number) => {
  todos.value = todos.value.filter((todo) => todo.id !== id)
  saveTodos()
}
```

問題是每個修改 state 的地方都要記得呼叫 `saveTodos`。

用 `watch` 的教學意義是：

> 修改 state 是一件事，同步保存是另一件事。`watch` 可以讓保存邏輯集中在一個地方。

## 拆 component 後，持久化應該放哪？

不要放在：

- `TodoForm.vue`
- `TodoItem.vue`
- `TodoList.vue`

因為這些元件只是 UI 邊界。

持久化應該先放在 `App.vue`，原因是：

- `App.vue` 擁有 `todos`
- 新增、刪除、完成都最後回到 `App.vue`
- `localStorage` 保存的是整份 TODO list，不是某個輸入框或某個 item

之後如果再進一步抽象，可以抽成 composable：

```ts
const { todos, addTodo, toggleTodo, deleteTodo } = useTodos()
```

但不要太早抽。學生要先理解資料為什麼會消失、為什麼要保存、保存放在哪個責任邊界。

## 這一課的 commit 目標

下一個實作 commit 應該只做這些事：

- 在 `App.vue` 加上 `localStorage` load/save
- 保留現有 components 不動
- 不改 UI
- 不新增 Pinia
- 不新增後端 API

建議 commit message：

```txt
feat: persist todos in localStorage
```

## 課堂檢查點

請學生回答：

- 為什麼 refresh 會讓 `ref` 裡的資料消失？
- `localStorage` 和 Vue state 有什麼不同？
- 為什麼要 `JSON.stringify`？
- 為什麼讀資料時要 `try/catch`？
- 為什麼持久化放在 `App.vue`，不是放在 `TodoItem.vue`？

## 延伸討論

當 TODO App 繼續變大，可以再問：

- 如果要登入後跨裝置同步，localStorage 還夠嗎？
- 如果有多個頁面都要使用 todos，`App.vue` 還適合持有 state 嗎？
- 什麼時候該使用 Pinia？
- 什麼時候該把資料存到後端？
