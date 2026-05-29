# 02：從複雜 App.vue 拆出 Components

## 你會學到什麼

這一章只學一件事：

> 當 `App.vue` 變得太大時，怎麼判斷哪些程式應該拆成 component。

不要把 component 拆分理解成「把 HTML 切小塊」。真正要練的是：

- 哪些 UI 有自己的責任
- 哪些 state 應該留在父層
- 子層要怎麼通知父層

## 開始前

請先看前一個版本的 `App.vue`。它已經包含：

- 新增 TODO 表單
- 表單驗證
- 搜尋與篩選
- TODO list
- 單一 TODO item
- 分類統計
- 批次操作

這個檔案可以跑，但它開始不好讀。

請先回答：

1. 如果只想改表單驗證，你要看哪些程式？
2. 如果只想改單一 TODO 的樣式，你會不會被 filter 邏輯干擾？
3. 如果只想改分類統計，你需要知道表單怎麼 submit 嗎？

如果答案是「會互相干擾」，代表可以開始拆 component。

## Step 1：先找責任，不要先找檔案

請把 `App.vue` 裡的程式分成幾種責任：

| 責任 | 對應內容 |
| --- | --- |
| 頁面摘要 | 標題、總數、完成數、逾期數 |
| 新增表單 | title、description、priority、category、due date、驗證 |
| 篩選工具 | search、statusFilter、priorityFilter、categoryFilter |
| 清單顯示 | 顯示 filtered todos、empty state |
| 單一項目 | title、description、完成按鈕、刪除按鈕 |
| 統計 | category summary |
| 資料狀態 | `todos`、新增、刪除、完成 |

這一步的重點：

> 先找「責任邊界」，再決定檔案怎麼拆。

## Step 2：拆出 TodoForm

`TodoForm` 負責新增 TODO 的互動流程。

它應該自己管理：

- title
- description
- priority
- category
- dueDate
- 表單驗證
- submit 後清空表單

它不應該管理：

- 整份 `todos`
- TODO id 怎麼產生
- SQLite / localStorage 怎麼保存

所以它送出時只 emit 一份 draft：

```ts
emit('addTodo', {
  title,
  description,
  priority,
  category,
  dueDate,
})
```

父層 `App.vue` 才負責真的新增到 `todos`。

## Step 3：拆出 TodoList 和 TodoItem

`TodoList` 負責「一組 todos」。

它需要知道：

- 目前要顯示哪些 todos
- 總共有幾筆
- 沒有資料時要顯示什麼

`TodoItem` 負責「一筆 todo」。

它需要知道：

- 這筆 todo 的 title
- description
- completed 狀態
- priority
- due date

`TodoItem` 不直接改資料。它只回報事件：

```ts
emit('toggleTodo', todo.id)
emit('deleteTodo', todo.id)
```

原因：

> 子層知道使用者點了什麼；父層負責決定 state 怎麼改。

## Step 4：拆出 TodoFilters

filter state 會影響 `filteredTodos`，而 `filteredTodos` 是在 `App.vue` 算出來的。

所以 filter state 留在 `App.vue`：

```ts
const search = ref('')
const statusFilter = ref('all')
const priorityFilter = ref('all')
const categoryFilter = ref('all')
const hideCompleted = ref(false)
```

`TodoFilters` 只負責畫面和操作。

它用 `v-model` 和父層同步：

```vue
<TodoList
  v-model:search="search"
  v-model:status-filter="statusFilter"
  v-model:priority-filter="priorityFilter"
  v-model:category-filter="categoryFilter"
  v-model:hide-completed="hideCompleted"
/>
```

請記住：

> 如果某個 state 會影響父層 computed 結果，它不應該只藏在子層。

## Step 5：整理共用型別

多個 component 都會用到 `Todo`、`Priority`、`TodoDraft`。

所以把型別放到：

```txt
src/types/todo.ts
```

這樣每個 component 都能引用同一份資料形狀。

## 拆完後的責任表

| 檔案 | 責任 |
| --- | --- |
| `App.vue` | 擁有 `todos`、filter state、computed、修改 state |
| `TodoForm.vue` | 管理表單輸入與驗證 |
| `TodoFilters.vue` | 管理篩選 UI |
| `TodoList.vue` | 顯示清單區塊與 empty state |
| `TodoItem.vue` | 顯示單一 TODO，回報完成與刪除事件 |
| `CategorySummary.vue` | 顯示分類統計 |
| `TodoHeader.vue` | 顯示頁面摘要 |
| `src/types/todo.ts` | 共用型別 |

## 父子元件怎麼傳？

規則：

> 父層傳「資料與設定」給子層；子層傳「使用者意圖」回父層。

| 關係 | 往下傳 | 往上傳 | 原因 |
| --- | --- | --- | --- |
| `App` -> `TodoHeader` | 統計數字 | 無 | Header 只顯示摘要 |
| `App` -> `TodoForm` | categories、priorities、defaultDueDate | `addTodo(draft)` | 表單只產生新增意圖 |
| `App` -> `TodoList` | filteredTodos、totalCount | toggle/delete/batch events | List 顯示資料，父層改 state |
| `TodoList` -> `TodoFilters` | filter values | `update:*` events | Filter UI 改變父層查詢條件 |
| `TodoList` -> `TodoItem` | todo、today | toggle/delete events | Item 顯示單筆資料 |
| `App` -> `CategorySummary` | categoryCounts | 無 | Summary 只顯示統計 |

## 檢查自己是否理解

請回答：

1. 為什麼 `TodoForm` 可以自己管理 title？
2. 為什麼 `TodoItem` 不直接改 `todo.completed`？
3. 為什麼 `todos` 留在 `App.vue`？
4. `TodoList` 和 `TodoItem` 的責任差在哪裡？
5. 拆 component 後，多了哪些成本？

## 本章重點

Component 拆分不是把 HTML 切小。

它是在切：

- 責任
- 資料所有權
- 互動流程
- 未來變動原因
