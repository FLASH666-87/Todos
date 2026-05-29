# 03：讓 TODO 在 refresh 後留下來

## 你會學到什麼

這一章只學一件事：

> Vue state 只存在記憶體裡；如果 refresh 後還要留下資料，就要把 state 同步到瀏覽器儲存空間。

這章使用 `localStorage`。

## 先觀察問題

請先操作目前的 TODO App：

1. 新增一筆 TODO
2. 勾選一筆 TODO 完成
3. 刪除一筆 TODO
4. refresh 頁面

你會看到：資料回到初始狀態。

原因：

> `ref` 裡的資料只存在目前這次 JavaScript 執行中。refresh 後 Vue app 重新開始，state 也重新建立。

## Step 1：找出真正要保存的 state

不是所有 state 都要保存。

要保存：

- `todos`
- todo title
- todo description
- todo completed
- todo priority
- todo category
- todo dueDate

不用保存：

- search
- statusFilter
- priorityFilter
- categoryFilter
- hideCompleted

原因：

> TODO 是資料；搜尋和篩選只是目前畫面怎麼看資料。

## Step 2：準備預設資料

先把預設 TODO 抽成 function：

```ts
const defaultTodos = (): Todo[] => [
  {
    id: 1,
    title: 'Learn Vue state and v-model',
    completed: false,
    // ...
  },
]
```

這樣之後如果 localStorage 沒資料，就可以回到預設資料。

## Step 3：從 localStorage 讀資料

`localStorage` 只能存字串，所以讀出來後要 `JSON.parse`。

```ts
const STORAGE_KEY = 'vue-todos'

const loadTodos = (): Todo[] => {
  const savedTodos = localStorage.getItem(STORAGE_KEY)

  if (!savedTodos) {
    return defaultTodos()
  }

  return JSON.parse(savedTodos)
}
```

但真實情況裡，localStorage 可能壞掉，所以要加 `try/catch`：

```ts
const loadTodos = (): Todo[] => {
  const savedTodos = storage()?.getItem(STORAGE_KEY)

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

## Step 4：寫入 localStorage

當 `todos` 改變時，把最新資料存進 localStorage。

```ts
watch(
  todos,
  (newTodos) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTodos))
  },
  { deep: true },
)
```

你需要知道三件事：

- `watch`：監聽 state 變化
- `JSON.stringify`：把 array/object 轉成字串
- `{ deep: true }`：監聽 todo 裡面的 `completed` 這種巢狀變化

## Step 5：為測試環境做保護

測試環境不一定有完整的 `localStorage`。

所以可以包一層：

```ts
const storage = () => {
  if (typeof localStorage === 'undefined') return null
  if (typeof localStorage.getItem !== 'function') return null
  if (typeof localStorage.setItem !== 'function') return null

  return localStorage
}
```

這樣瀏覽器可以正常存，測試環境也不會炸掉。

## 完成後請確認

操作：

1. 新增 TODO
2. 勾選完成
3. refresh

預期：

- 新增的 TODO 還在
- completed 狀態還在

## 檢查自己是否理解

請回答：

1. 為什麼 refresh 會讓 `ref` 裡的資料消失？
2. 為什麼 localStorage 要搭配 `JSON.stringify`？
3. 為什麼要 `try/catch`？
4. 為什麼 `search` 不需要存進 localStorage？
5. 為什麼持久化邏輯放在 `App.vue`，不是放在 `TodoItem.vue`？

## 本章重點

Component 拆分解決的是程式結構。

State persistence 解決的是：

> 資料離開這次頁面生命週期後，還要不要留下來。
