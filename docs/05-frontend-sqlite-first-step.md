# 05：前端 SQLite 第一課

## 你會學到什麼

這一章只學兩件事：

1. `localStorage` 是 key-value；SQLite 是 table
2. Vue state 可以從 SQLite `SELECT` 的結果建立

不要在這章學完整 CRUD。

## 開始前

上一章的資料來源是 localStorage：

```txt
Vue state
  -> JSON.stringify
  -> localStorage
```

這章改成：

```txt
browser SQLite
  -> SELECT
  -> Todo[]
  -> Vue state
```

畫面仍然吃 `todos` state，只是 `todos` 的來源變了。

## 先認識 onMounted

`onMounted` 是 Vue 的生命週期 hook。

你可以先這樣理解：

> Component 被放到畫面上之後，`onMounted` 裡的程式才會執行。

這章用它載入 SQLite 資料：

```ts
onMounted(async () => {
  await initializeTodoDatabase(defaultTodos())
  todos.value = listTodosFromSqlite()
})
```

為什麼不直接在最上面讀？

因為 SQLite 載入是 async，而且需要瀏覽器環境。

## 什麼是 browser SQLite？

這裡的 SQLite 不是後端資料庫。

這章使用 `sql.js`，它把 SQLite 編譯成 WebAssembly，讓 SQLite 可以跑在瀏覽器裡。

資料流：

```txt
Vue component
  -> onMounted
  -> sql.js
  -> SQLite table in browser memory
  -> SELECT rows
  -> todos state
```

這仍然是前端課，沒有 server，也沒有 API。

## Step 1：安裝 sql.js

```sh
npm install sql.js @types/sql.js
```

安裝後，專案可以在瀏覽器裡建立 SQLite database。

## Step 2：建立 todos table

在 `src/lib/todoSqlite.ts` 裡建立 table：

```sql
CREATE TABLE IF NOT EXISTS todos (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  completed INTEGER NOT NULL,
  priority TEXT NOT NULL,
  category TEXT NOT NULL,
  due_date TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

請觀察欄位和 `Todo` type 的關係：

```ts
type Todo = {
  id: number
  title: string
  description: string
  completed: boolean
  priority: Priority
  category: string
  dueDate: string
  createdAt: string
}
```

差異：

- TypeScript 用 `boolean`
- SQLite 用 `0` / `1`
- TypeScript 用 `dueDate`
- SQL table 用 `due_date`

## Step 3：seed 預設資料

目前還沒有真的保存 SQLite 檔案，所以先把預設 TODO 寫進 table。

```txt
defaultTodos()
  -> INSERT INTO todos
```

這一步只是為了讓學生看得到 table 裡有資料。

## Step 4：SELECT 回 Vue state

SQLite 查詢：

```sql
SELECT
  id,
  title,
  description,
  completed,
  priority,
  category,
  due_date,
  created_at
FROM todos
ORDER BY id;
```

查出來後轉回 `Todo[]`：

```ts
const rows = result[0]?.values ?? []
return rows.map(mapRowToTodo)
```

最後在 `App.vue`：

```ts
onMounted(async () => {
  await initializeTodoDatabase(defaultTodos())
  todos.value = listTodosFromSqlite()
})
```

## Step 5：看畫面

畫面上會顯示：

```txt
Data source: Browser SQLite
```

這代表目前 TODO 是從 browser SQLite 查出來的。

## 檢查自己是否理解

請回答：

1. localStorage 和 SQLite 最大差別是什麼？
2. 為什麼 SQLite 的 completed 用 `0` / `1`？
3. 為什麼要把 `due_date` 轉回 `dueDate`？
4. `onMounted` 在這裡負責什麼？
5. Vue template 最後吃的是 SQL result 還是 `todos` state？

## 本章重點

localStorage 是：

```txt
key -> string
```

SQLite 是：

```txt
table -> rows -> SELECT
```

但 Vue 畫面仍然只需要：

```ts
const todos = ref<Todo[]>([])
```
