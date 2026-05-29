import initSqlJs from 'sql.js'
import sqliteWasmUrl from 'sql.js/dist/sql-wasm.wasm?url'
import type { Database } from 'sql.js'
import type { Priority, Todo, TodoDraft } from '@/types/todo'

type TodoRow = [number, string, string, number, Priority, string, string, string]

let database: Database | null = null

const requireDatabase = () => {
  if (!database) {
    throw new Error('SQLite database has not been initialized.')
  }

  return database
}

const createTodoTable = (db: Database) => {
  db.run(`
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
  `)
}

const countTodos = (db: Database) => {
  const result = db.exec('SELECT COUNT(*) FROM todos;')
  return Number(result[0]?.values[0]?.[0] ?? 0)
}

const seedTodos = (db: Database, todos: Todo[]) => {
  if (countTodos(db) > 0) return

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

export const initializeTodoDatabase = async (seedData: Todo[]): Promise<void> => {
  const SQL = await initSqlJs({
    locateFile: () => sqliteWasmUrl,
  })

  database = new SQL.Database()

  createTodoTable(database)
  seedTodos(database, seedData)
}

export const listTodosFromSqlite = (): Todo[] => {
  const db = requireDatabase()
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
  return rows.map(mapRowToTodo)
}

export const insertTodoIntoSqlite = (draft: TodoDraft, createdAt: string): void => {
  const db = requireDatabase()
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

  insert.run([
    Date.now(),
    draft.title,
    draft.description,
    0,
    draft.priority,
    draft.category,
    draft.dueDate,
    createdAt,
  ])

  insert.free()
}

export const updateTodoCompletedInSqlite = (id: number, completed: boolean): void => {
  const db = requireDatabase()
  const update = db.prepare(`
    UPDATE todos
    SET completed = ?
    WHERE id = ?;
  `)

  update.run([completed ? 1 : 0, id])
  update.free()
}

export const deleteTodoFromSqlite = (id: number): void => {
  const db = requireDatabase()
  const remove = db.prepare(`
    DELETE FROM todos
    WHERE id = ?;
  `)

  remove.run([id])
  remove.free()
}

export const deleteCompletedTodosFromSqlite = (): void => {
  const db = requireDatabase()

  db.run(`
    DELETE FROM todos
    WHERE completed = 1;
  `)
}
