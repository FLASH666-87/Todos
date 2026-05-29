# 06：把 TODO 操作改成 SQLite CRUD

## 你會學到什麼

這一章只學一件事：

> 原本改 JavaScript array 的地方，可以改成 SQL mutation。

對照表：

| Vue 操作 | 原本 array 寫法 | SQLite 寫法 |
| --- | --- | --- |
| 新增 TODO | `push` | `INSERT` |
| 完成 TODO | 改 `todo.completed` | `UPDATE` |
| 刪除 TODO | `filter` | `DELETE` |
| 清除完成 TODO | `filter(!completed)` | `DELETE WHERE completed = 1` |

## 開始前

上一章只做讀取：

```txt
SQLite table
  -> SELECT
  -> todos state
```

這章加入修改：

```txt
使用者操作
  -> SQL INSERT / UPDATE / DELETE
  -> export SQLite database bytes
  -> save bytes to IndexedDB
  -> SELECT 最新 rows
  -> 更新 todos state
```

先不要講 transaction、rollback、optimistic update、repository。

## Step 1：保留 database instance

上一章每次讀完就結束。

這章需要讓新增、更新、刪除都操作同一個 SQLite database。

所以在 `todoSqlite.ts` 裡保留：

```ts
let database: Database | null = null
```

然後用 helper 確認 database 已經初始化：

```ts
const requireDatabase = () => {
  if (!database) {
    throw new Error('SQLite database has not been initialized.')
  }

  return database
}
```

## Step 2：新增 TODO 對應 INSERT

原本在 `App.vue`：

```ts
todos.value.push(...)
```

現在改成：

```ts
insertTodoIntoSqlite(draft, today)
refreshTodosFromSqlite()
```

實際上 `insertTodoIntoSqlite` 是 async，因為 INSERT 後會把 SQLite database bytes 寫回 IndexedDB：

```ts
await insertTodoIntoSqlite(draft, today)
refreshTodosFromSqlite()
```

SQL：

```sql
INSERT INTO todos (
  id,
  title,
  description,
  completed,
  priority,
  category,
  due_date,
  created_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
```

重點：

> 原本新增一個 object 到 array，現在新增一列到 table。

## Step 3：完成 TODO 對應 UPDATE

原本：

```ts
todo.completed = !todo.completed
```

現在：

```ts
updateTodoCompletedInSqlite(id, !todo.completed)
refreshTodosFromSqlite()
```

實作時：

```ts
await updateTodoCompletedInSqlite(id, !todo.completed)
refreshTodosFromSqlite()
```

SQL：

```sql
UPDATE todos
SET completed = ?
WHERE id = ?;
```

請注意：

> `UPDATE` 一定要有 `WHERE`，不然會改到整張 table。

## Step 4：刪除 TODO 對應 DELETE

原本：

```ts
todos.value = todos.value.filter((todo) => todo.id !== id)
```

現在：

```ts
deleteTodoFromSqlite(id)
refreshTodosFromSqlite()
```

實作時：

```ts
await deleteTodoFromSqlite(id)
refreshTodosFromSqlite()
```

SQL：

```sql
DELETE FROM todos
WHERE id = ?;
```

請注意：

> `DELETE` 也要小心 `WHERE`。

## Step 5：清除完成項目

原本：

```ts
todos.value = todos.value.filter((todo) => !todo.completed)
```

現在：

```ts
deleteCompletedTodosFromSqlite()
refreshTodosFromSqlite()
```

實作時：

```ts
await deleteCompletedTodosFromSqlite()
refreshTodosFromSqlite()
```

SQL：

```sql
DELETE FROM todos
WHERE completed = 1;
```

## 為什麼每次 mutation 後要 SELECT？

這章先用最容易理解的方式：

```txt
SQL mutation
  -> table 改變
  -> db.export()
  -> IndexedDB 保存
  -> SELECT 最新資料
  -> todos.value = 最新資料
```

這樣學生可以清楚看到：

- SQLite table 是資料來源
- IndexedDB 保存 SQLite database bytes
- Vue state 是畫面快照
- 畫面仍然只依賴 `todos`

## 完成後請測試

請在畫面操作：

1. 新增一筆 TODO
2. 勾選完成
3. 刪除一筆 TODO
4. Clear completed

預期：

- 畫面會更新
- `Data source` 仍然是 `Persistent browser SQLite`
- refresh 後資料還在
- 所有操作都會先改 SQLite，保存到 IndexedDB，再 SELECT 回 Vue state

## 檢查自己是否理解

請回答：

1. `push` 對應哪個 SQL？
2. `todo.completed = true` 對應哪個 SQL？
3. `filter` 刪除一筆對應哪個 SQL？
4. 為什麼 `UPDATE` 和 `DELETE` 要有 `WHERE`？
5. 為什麼 mutation 後要把 SQLite database bytes 存進 IndexedDB？
6. 為什麼 mutation 後要再 `SELECT`？

## 本章重點

前端畫面操作可以對應成 SQL：

```txt
Create -> INSERT
Read   -> SELECT
Update -> UPDATE
Delete -> DELETE
```

這就是 CRUD。
