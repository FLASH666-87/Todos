# 教學 02：從複雜 App.vue 拆出 Component 的思維

## 這一課的前提

上一個版本的 TODO App 已經不是最簡單的範例。

它有：

- 新增 TODO 表單
- 表單驗證
- title / description 字數限制
- priority / category / due date
- 搜尋
- 狀態篩選
- priority 篩選
- category 篩選
- hide completed
- 批次完成
- 清除完成項目
- 分類統計
- 單一 TODO 的完成 / 刪除

這時候 `App.vue` 開始變大，這正是教 component 的好時機。

不要一開始就說：

> 我們來拆 component。

應該先問：

> 現在這個檔案哪裡開始不好讀？  
> 如果我要改表單驗證，我要看哪些程式？  
> 如果我要改 TODO item 的樣式，我會不會被 filter 邏輯干擾？

Component 拆分要從痛點出發。

## 單一職責不是「一個檔案只能做一件小事」

很多學生會誤會單一職責。

單一職責不是說：

- 一個 component 只能有一個 button
- 一個 component 只能有十行
- 看到 input 就一定要拆
- HTML 一變長就一定要拆

比較好的說法是：

> 一個 component 應該有一個清楚的改變理由。

也就是說：

如果表單規則改變，只應該主要影響 `TodoForm.vue`。  
如果 TODO item 的顯示方式改變，只應該主要影響 `TodoItem.vue`。  
如果篩選 UI 改變，只應該主要影響 `TodoFilters.vue`。

這叫做「變動原因」的邊界。

## 拆分邏輯一：依 UI 區塊拆

這是最容易理解的第一層。

畫面上有幾個明顯區塊：

- 頁面標題與統計：`TodoHeader`
- 新增表單：`TodoForm`
- 分類統計：`CategorySummary`
- 篩選工具列：`TodoFilters`
- TODO 清單：`TodoList`
- 單一 TODO：`TodoItem`

這種拆法適合剛開始，因為學生可以直接從畫面對應到檔案。

但要提醒：

> 只看 UI 長相還不夠，還要看資料和互動。

## 拆分邏輯二：依互動流程拆

`TodoForm` 不只是「一塊表單 UI」。

它其實包含一個完整流程：

1. 使用者輸入 title
2. 使用者輸入 description
3. 使用者選 priority
4. 使用者選 category
5. 使用者選 due date
6. 表單檢查 title 至少 3 個字
7. 表單檢查字數限制
8. submit 時送出乾淨資料
9. 成功送出後清空表單

這是一個完整的互動流程，所以適合拆成 `TodoForm.vue`。

教學時可以這樣說：

> 如果一塊 UI 有自己的輸入、驗證、送出和清空流程，它通常已經不只是 HTML，而是一個 component。

## 拆分邏輯三：依資料角色拆

`TodoList` 和 `TodoItem` 是不同角色。

`TodoList` 關心的是「一組 todos」：

- 現在有幾筆要顯示
- 沒有資料時顯示 empty state
- 每筆資料要交給 `TodoItem`

`TodoItem` 關心的是「一筆 todo」：

- title 怎麼顯示
- description 怎麼顯示
- priority badge 怎麼顯示
- due date 狀態怎麼顯示
- 點完成時送出事件
- 點刪除時送出事件

所以它們適合拆開。

不要讓 `TodoList` 同時負責每一筆 item 的細節，否則清單一變複雜，list component 又會開始膨脹。

## 拆分邏輯四：依 state 所有權拆

這是最重要的一段。

拆 component 不是把 state 隨便搬來搬去。

要先問：

> 這個 state 是誰需要知道？

### TodoForm 擁有自己的表單 state

例如：

- title
- description
- priority
- category
- dueDate
- titleCharactersLeft
- canSubmit

這些 state 只有新增表單自己需要知道。

`App.vue` 不需要知道使用者目前打了幾個字。  
`TodoList` 也不需要知道表單有沒有錯誤。

所以這些 state 放進 `TodoForm.vue`。

表單完成後，只送出一份乾淨資料：

```ts
emit('addTodo', {
  title: trimmedTitle.value,
  description: trimmedDescription.value || 'No description.',
  priority: priority.value,
  category: category.value,
  dueDate: dueDate.value,
})
```

### App.vue 擁有 todos

`todos` 不適合放進 `TodoForm`，也不適合放進 `TodoItem`。

因為 `todos` 會被很多地方使用：

- `TodoHeader` 要統計總數
- `CategorySummary` 要統計分類
- `TodoList` 要顯示資料
- `TodoFilters` 會影響顯示結果
- 新增、刪除、完成都會改它

所以 `todos` 放在共同父層 `App.vue`。

教學句：

> state 放在最小但足夠共用的地方。

不是全部都放子層，也不是全部都丟全域。

## 拆分邏輯五：依變動原因拆

這是比較接近真實工作的判斷方式。

可以問學生：

> 如果未來需求改變，哪一塊最可能被單獨修改？

例如：

- 表單驗證規則常改：拆 `TodoForm`
- TODO item 樣式常改：拆 `TodoItem`
- 篩選條件常增加：拆 `TodoFilters`
- 統計方式常改：拆 `CategorySummary`

這樣拆的好處是，未來改需求時比較不會動到不相關的地方。

## 拆完後的資料流

拆 component 後，會多出一個新難點：資料怎麼流動？

這就是前端一開始不好學的地方。

### 父層傳資料給子層：props

例如 `App.vue` 傳資料給 `TodoList`：

```vue
<TodoList
  :todos="filteredTodos"
  :total-count="todos.length"
  :today="today"
/>
```

這代表：

> 子層負責顯示，但資料來源仍然在父層。

### 子層通知父層：emit

例如 `TodoItem` 不直接修改 `todos`。

它只通知父層：

```ts
emit('toggleTodo', todo.id)
```

真正修改 state 的地方還是在 `App.vue`：

```ts
const toggleTodo = (id: number) => {
  const todo = todos.value.find((item) => item.id === id)
  if (!todo) return

  todo.completed = !todo.completed
}
```

這就是：

> props down, events up

## 父子元件傳遞時要注意什麼？

拆完 component 後，最容易亂掉的地方不是 template，而是資料流。

可以用這個原則教學生：

> 父層傳「資料與設定」給子層，子層傳「使用者意圖」回父層。

### App.vue 傳資料給 TodoHeader

`TodoHeader` 只需要顯示摘要，不需要知道 todos 怎麼來、怎麼篩選、怎麼修改。

所以父層傳已經算好的數字：

```vue
<TodoHeader
  :total-count="todos.length"
  :active-count="activeTodos.length"
  :completed-count="completedTodos.length"
  :overdue-count="overdueTodos.length"
/>
```

這樣做的原因是：

- `TodoHeader` 不需要拿整包 `todos`
- `TodoHeader` 不需要知道統計邏輯
- 統計邏輯留在擁有 state 的 `App.vue`
- header component 變成單純的 presentational component

教學句：

> 子層需要什麼，就傳什麼；不要為了方便把整包資料都丟下去。

### App.vue 傳設定給 TodoForm

`TodoForm` 需要知道有哪些 category、priority，以及預設日期。

```vue
<TodoForm
  :categories="categories"
  :priorities="priorities"
  :default-due-date="today"
  @add-todo="addTodo"
/>
```

這裡父層傳下去的是「表單選項」和「預設值」。

但 `TodoForm` 自己管理：

- title
- description
- selected priority
- selected category
- due date
- validation state

原因是這些資料只有表單內部需要。

等使用者 submit 後，`TodoForm` 不直接改 `todos`，而是 emit 一個乾淨的 draft：

```ts
emit('addTodo', {
  title,
  description,
  priority,
  category,
  dueDate,
})
```

這樣做的原因是：

- `TodoForm` 負責收集資料
- `App.vue` 負責新增到 todos
- 子層不需要知道 TODO 的 id 怎麼產生
- 子層不需要知道資料要不要存 localStorage

教學句：

> 表單負責產生「新增 TODO 的意圖」，父層負責把這個意圖變成真正的 state mutation。

### App.vue 和 TodoFilters 用 v-model 溝通

filter state 放在 `App.vue`，因為它會影響 `filteredTodos`。

```vue
<TodoList
  v-model:search="search"
  v-model:status-filter="statusFilter"
  v-model:priority-filter="priorityFilter"
  v-model:category-filter="categoryFilter"
  v-model:hide-completed="hideCompleted"
/>
```

這背後其實等於：

```vue
<TodoList
  :search="search"
  @update:search="search = $event"
/>
```

為什麼 filter state 不放在 `TodoFilters`？

因為真正使用 filter state 的地方是 `App.vue` 的 `filteredTodos`：

```ts
const filteredTodos = computed(() => {
  return todos.value
    .filter(...)
    .filter(...)
})
```

也就是說：

- `TodoFilters` 負責操作 UI
- `App.vue` 負責根據 filter state 算出資料

教學句：

> 如果某個 state 會影響父層的 computed 結果，就不應該只藏在子層。

### App.vue 傳 todos 給 TodoList

`TodoList` 不需要知道所有 todos，它只需要知道目前要顯示的 todos。

```vue
<TodoList
  :todos="filteredTodos"
  :total-count="todos.length"
/>
```

這樣做的原因是：

- 篩選邏輯留在 `App.vue`
- `TodoList` 只負責渲染「收到的清單」
- `TodoList` 不需要知道搜尋字串、分類、狀態篩選如何組合

教學句：

> List component 最好收到已經準備好的資料，而不是自己又去重做 business logic。

### TodoList 傳單筆 todo 給 TodoItem

`TodoList` 把每一筆 todo 交給 `TodoItem`：

```vue
<TodoItem
  v-for="todo in todos"
  :key="todo.id"
  :todo="todo"
  @toggle-todo="emit('toggleTodo', $event)"
  @delete-todo="emit('deleteTodo', $event)"
/>
```

`TodoItem` 不直接修改 todo，而是 emit 事件。

原因是：

- `todo` 是 props，props 應該視為父層資料
- 子層直接改 props 會讓資料流變難追
- 父層才知道完整 state 要怎麼更新
- 之後加 localStorage 時，也只要監聽父層 todos

教學句：

> TodoItem 可以知道「使用者點了什麼」，但不應該決定「整份 todos state 怎麼改」。

### 傳遞規則總表

| 關係 | 往下傳什麼 | 往上傳什麼 | 原因 |
| --- | --- | --- | --- |
| `App` -> `TodoHeader` | 統計數字 | 無 | header 只顯示摘要 |
| `App` -> `TodoForm` | categories、priorities、defaultDueDate | `addTodo(draft)` | 表單產生新增意圖，父層新增資料 |
| `App` -> `TodoList` | filteredTodos、totalCount | toggle/delete/batch events | list 顯示資料，父層修改 state |
| `TodoList` -> `TodoFilters` | filter values | `update:*` events | filter UI 改變父層查詢條件 |
| `TodoList` -> `TodoItem` | todo、today | toggle/delete events | item 顯示單筆資料，事件往上回報 |
| `App` -> `CategorySummary` | categoryCounts | 無 | summary 只顯示已算好的統計 |

## 為什麼不要讓子層直接改資料？

短期看起來比較快：

```vue
<TodoItem :todo="todo" />
```

然後在 `TodoItem` 裡直接：

```ts
todo.completed = !todo.completed
```

但這會造成幾個問題：

- 不知道是哪個 component 改了 state
- 未來加 localStorage、API、undo 時很難集中處理
- 父層資料可能被深層子層悄悄修改
- 測試時很難確認 state mutation 的入口

所以課堂上可以強調：

> 子層可以發生事件，但父層負責改 state。

## 拆分的代價

一定要講拆分的代價，否則學生會以為拆越多越好。

拆之前：

- 所有東西在同一個檔案
- 很直覺
- 小專案很好懂

拆之後：

- 檔案變多
- 要追 props
- 要追 emits
- 要設計型別
- 要決定 state 放哪裡

所以不是每個小東西都要拆。

比較好的判斷是：

> 當不拆會讓閱讀、修改、測試變痛苦時，再拆。

## 這個 commit 的教學重點

這個 commit 做的不是功能改版，而是結構整理。

功能沒有變：

- 還是可以新增 TODO
- 還是可以篩選
- 還是可以完成 / 刪除
- 還是可以看統計

但程式責任改變了：

| 檔案 | 責任 |
| --- | --- |
| `App.vue` | 擁有 todos、篩選 state、修改 todos |
| `TodoForm.vue` | 管理新增表單與驗證 |
| `TodoFilters.vue` | 管理篩選 UI |
| `TodoList.vue` | 管理清單區塊與 empty state |
| `TodoItem.vue` | 管理單一 TODO 顯示與操作 |
| `CategorySummary.vue` | 顯示分類統計 |
| `TodoHeader.vue` | 顯示頁面標題與摘要 |
| `src/types/todo.ts` | 共用型別 |

## 課堂操作建議

教學時不要直接看拆完後的結果。

建議流程：

1. 先 checkout 複雜單檔版本
2. 讓學生找出 `App.vue` 裡有哪些責任
3. 問學生第一個想拆哪裡
4. 先拆 `TodoForm`
5. 解釋 local state 和 emit
6. 再拆 `TodoItem`
7. 解釋 props 和 events
8. 最後拆 `TodoFilters`、`TodoList`、`CategorySummary`

這樣學生會比較理解為什麼拆，而不是只記住檔案結構。

## 課堂檢查點

請學生回答：

- `TodoForm` 為什麼可以自己擁有 title state？
- `TodoItem` 為什麼不直接修改 todo？
- `todos` 為什麼留在 `App.vue`？
- `TodoList` 和 `TodoItem` 的責任差在哪裡？
- 拆 component 後，程式變好了，但多了哪些成本？

## 一句話總結

Component 拆分不是把 HTML 切小塊，而是把「責任、資料、互動流程、變動原因」切出清楚邊界。
