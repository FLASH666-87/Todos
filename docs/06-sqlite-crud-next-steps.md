# 教學 06：把前端操作對應成 SQLite CRUD

## 這堂課只新增一個學習點

學習點：

> 前端操作可以對應成 SQL mutation。

上一堂只講：

- localStorage 是 key-value
- SQLite 是 table
- `Todo` type 可以對應成 `todos` table
- 先用 `SELECT` 把資料讀回 Vue state

這堂課開始讓學生看到：畫面上的新增、完成、刪除，其實都可以變成 SQL。

不要一次講 repository、API、同步、vector DB。

只讓學生看到目前 Vue 裡的 methods，可以對應到 SQL：

```txt
addTodo            -> INSERT
toggleTodo         -> UPDATE
deleteTodo         -> DELETE
clearCompletedTodo -> DELETE WHERE completed = 1
```

課堂主軸：

> 原本我們改的是 JavaScript array；現在我們改 SQLite table，然後再 SELECT 回 Vue state。

## 實作策略

這堂課仍然保持前端 scope。

資料流是：

```txt
使用者操作
  -> Vue method
  -> SQLite INSERT / UPDATE / DELETE
  -> SELECT todos
  -> 更新 Vue state
```

不要讓畫面直接依賴 SQL result object。

Vue component 最後仍然只吃：

```ts
const todos = ref<Todo[]>([])
```

這樣學生比較容易理解：

> 底層資料來源換成 SQLite，但畫面仍然是用 Vue state render。

## 從新增開始：INSERT

localStorage / array 版本的新增是：

```ts
const addTodo = (draft: TodoDraft) => {
  todos.value.push({
    id: Date.now(),
    title: draft.title,
    description: draft.description,
    completed: false,
    priority: draft.priority,
    category: draft.category,
    dueDate: draft.dueDate,
    createdAt: today,
  })
}
```

SQLite 版本變成：

```sql
INSERT INTO todos (
  title,
  description,
  completed,
  priority,
  category,
  due_date,
  created_at
) VALUES (?, ?, ?, ?, ?, ?, ?);
```

教學句：

> 原本 push 到 array，現在 insert 到 table。

實作上，新增後再查一次：

```ts
insertTodoIntoSqlite(draft, today)
todos.value = listTodosFromSqlite()
```

先用這種方式是因為它最清楚：

- SQL 負責改 table
- SELECT 負責拿最新資料
- Vue state 負責 render 畫面

## 完成狀態：UPDATE

array 版本的完成切換是：

```ts
todo.completed = !todo.completed
```

SQLite 版本變成：

```sql
UPDATE todos
SET completed = ?
WHERE id = ?;
```

教學句：

> 原本改 object property，現在 update table 裡某一列。

這裡可以提醒學生：

> UPDATE 一定要有 WHERE，不然會改到整張 table。

## 刪除：DELETE

array 版本的刪除是：

```ts
todos.value = todos.value.filter((todo) => todo.id !== id)
```

SQLite 版本變成：

```sql
DELETE FROM todos
WHERE id = ?;
```

教學句：

> 原本從 array 過濾掉一筆，現在從 table 刪掉一列。

同樣要提醒：

> DELETE 也要小心 WHERE。

## 清除完成：DELETE WHERE

array 版本：

```ts
todos.value = todos.value.filter((todo) => !todo.completed)
```

SQLite 版本：

```sql
DELETE FROM todos
WHERE completed = 1;
```

教學句：

> 原本保留未完成項目，現在刪掉 completed = 1 的 rows。

## 為什麼 mutation 後要再 SELECT？

這堂課先不要做複雜同步策略。

最簡單的 mental model 是：

```txt
mutation SQL
  -> table 改變
  -> SELECT 最新資料
  -> todos.value = rows
```

也就是：

> table 是資料來源，Vue state 是畫面快照。

這也可以銜接未來的後端 API：

```txt
POST /todos
  -> DB 改變
  -> GET /todos
  -> 更新前端 state
```

## 這堂課暫時不要講太多

先不要講：

- transaction
- rollback
- optimistic update
- migration
- relation
- index
- vector search

下一堂只要讓學生完成一個 mapping：

```txt
array operation <-> SQL operation
```

## 課堂練習

請學生把目前的 Vue method 對照 SQL：

| Vue 操作 | Array 寫法 | SQL 寫法 |
| --- | --- | --- |
| 新增 | `todos.value.push(...)` | `INSERT INTO todos ...` |
| 完成 | `todo.completed = true` | `UPDATE todos SET completed = 1` |
| 刪除 | `filter(...)` | `DELETE FROM todos WHERE id = ?` |
| 清除完成 | `filter(!completed)` | `DELETE FROM todos WHERE completed = 1` |

## 下一步再考慮實作

這堂已經實作 SQLite mutation，但仍然刻意不做完整資料庫課。

下一步才適合討論：

- SQLite 資料要不要真的持久保存成檔案
- repository 要不要再抽一層
- 之後如果換成後端 API，要改哪些地方
