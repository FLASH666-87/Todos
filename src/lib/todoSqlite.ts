import initSqlJs from 'sql.js'
import sqliteWasmUrl from 'sql.js/dist/sql-wasm.wasm?url'
import type { Database } from 'sql.js'
import type { Priority, Todo } from '@/types/todo'

type TodoRow = [
  number,
  string,
  string,
  number,
  Priority,
  string,
  string,
  string,
]

const createTodoTable = (db: Database) => {
  db.run(`
    CREATE TABLE todos (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      completed INTEGER NOT NULL,
      priority TEXT NOT NULL,
      category TEXT NOT NULL,
      due_date TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `)
}

const seedTodos = (db: Database, todos: Todo[]) => {
  const insert = db.prepare(`
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
  `)

  todos.forEach((todo) => {
    insert.run([
      todo.id,
      todo.title,
      todo.description,
      todo.completed ? 1 : 0,
      todo.priority,
      todo.category,
      todo.dueDate,
      todo.createdAt,
    ])
  })

  insert.free()
}

const mapRowToTodo = (row: TodoRow): Todo => {
  return {
    id: row[0],
    title: row[1],
    description: row[2],
    completed: row[3] === 1,
    priority: row[4],
    category: row[5],
    dueDate: row[6],
    createdAt: row[7],
  }
}

export const listTodosFromSqlite = async (seedData: Todo[]): Promise<Todo[]> => {
  const SQL = await initSqlJs({
    locateFile: () => sqliteWasmUrl,
  })

  const db = new SQL.Database()

  createTodoTable(db)
  seedTodos(db, seedData)

  const result = db.exec(`
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
  `)

  const rows = (result[0]?.values ?? []) as TodoRow[]
  const todos = rows.map(mapRowToTodo)

  db.close()

  return todos
}
