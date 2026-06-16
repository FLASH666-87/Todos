import { initializeApp } from 'firebase/app'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  orderBy,
  setDoc,
  writeBatch,
} from 'firebase/firestore'
import {
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import type { User } from 'firebase/auth'
import type { Todo } from '@/types/todo'

const firebaseConfig = {
  apiKey: 'AIzaSyDdi3Lockk9x9nbbba5nt5g5cdDaupicj4',
  authDomain: 'todos-4e0df.firebaseapp.com',
  projectId: 'todos-4e0df',
  storageBucket: 'todos-4e0df.firebasestorage.app',
  messagingSenderId: '307381376127',
  appId: '1:307381376127:web:5da4fec0698bd96ecedb4a',
  measurementId: 'G-742T8T62FY',
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const googleProvider = new GoogleAuthProvider()

export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback)
}

export async function login(): Promise<'ok' | 'popup-blocked'> {
  try {
    await signInWithPopup(auth, googleProvider)
    return 'ok'
  } catch (e: unknown) {
    if (e instanceof Error && 'code' in e && (e as { code: string }).code === 'auth/popup-blocked') {
      return 'popup-blocked'
    }
    throw e
  }
}

export async function resolveRedirectResult(): Promise<User | null> {
  try {
    const result = await getRedirectResult(auth)
    return result?.user ?? null
  } catch {
    return null
  }
}

export async function logout(): Promise<void> {
  await signOut(auth)
}

const TODOS_COLLECTION = 'todos'

function mapDoc(id: string, data: Record<string, unknown>): Todo {
  return {
    id: Number(id),
    parentId: (data.parentId as number) ?? null,
    title: data.title as string,
    description: data.description as string,
    completed: data.completed as boolean,
    priority: data.priority as Todo['priority'],
    category: data.category as string,
    dueDate: data.dueDate as string,
    createdAt: data.createdAt as string,
  }
}

export function subscribeTodos(onChange: (todos: Todo[]) => void): () => void {
  const q = query(collection(db, TODOS_COLLECTION), orderBy('id', 'asc'))

  return onSnapshot(q, (snapshot) => {
    const todos: Todo[] = []
    snapshot.forEach((docSnap) => {
      todos.push(mapDoc(docSnap.id, docSnap.data() as Record<string, unknown>))
    })
    onChange(todos)
  })
}

export async function addTodos(todos: Todo[]): Promise<void> {
  const batch = writeBatch(db)

  for (const todo of todos) {
    const ref = doc(db, TODOS_COLLECTION, String(todo.id))
    batch.set(ref, todo)
  }

  await batch.commit()
}

export async function toggleTodo(id: number, completed: boolean): Promise<void> {
  const ref = doc(db, TODOS_COLLECTION, String(id))
  await setDoc(ref, { completed }, { merge: true })
}

export async function deleteTodo(id: number): Promise<void> {
  const ref = doc(db, TODOS_COLLECTION, String(id))
  const snap = await getDoc(ref)
  if (!snap.exists()) return

  const parentId = (snap.data().parentId as number | null) ?? null

  const childrenQuery = query(collection(db, TODOS_COLLECTION), orderBy('id', 'asc'))
  const childrenSnap = await getDocs(childrenQuery)
  const batch = writeBatch(db)

  childrenSnap.forEach((childDoc) => {
    const childData = childDoc.data()
    if (childData.parentId === id) {
      batch.set(doc(db, TODOS_COLLECTION, childDoc.id), { parentId }, { merge: true })
    }
  })

  batch.delete(ref)
  await batch.commit()
}

export async function completeFilteredTodos(ids: number[]): Promise<void> {
  const batch = writeBatch(db)

  ids.forEach((id) => {
    batch.set(doc(db, TODOS_COLLECTION, String(id)), { completed: true }, { merge: true })
  })

  await batch.commit()
}

export async function clearCompletedTodos(): Promise<void> {
  const q = query(collection(db, TODOS_COLLECTION), orderBy('id', 'asc'))
  const snap = await getDocs(q)
  const batch = writeBatch(db)

  const completedIds = new Set<number>()
  const completedParentMap = new Map<number, number | null>()

  snap.forEach((docSnap) => {
    const data = docSnap.data()
    if (data.completed) {
      const id = Number(docSnap.id)
      completedIds.add(id)
      completedParentMap.set(id, (data.parentId as number | null) ?? null)
    }
  })

  snap.forEach((docSnap) => {
    const childData = docSnap.data()
    const childParentId = childData.parentId as number | null
    if (childParentId !== null && completedIds.has(childParentId)) {
      const newParent = completedParentMap.get(childParentId) ?? null
      batch.set(doc(db, TODOS_COLLECTION, docSnap.id), { parentId: newParent }, { merge: true })
    }
  })

  completedIds.forEach((id) => {
    batch.delete(doc(db, TODOS_COLLECTION, String(id)))
  })

  await batch.commit()
}
