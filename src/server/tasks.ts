import { createServerFn } from '@tanstack/react-start'
import { and, eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { requireUser } from '@/lib/session.server'
import { tasks } from '@/db/schema'
import { requiredText } from '@/lib/validation'

export const saveTask = createServerFn({ method: 'POST' }).validator((input: { id?: string; title: string; priority: string }) => input).handler(async ({ data }) => {
  const user = await requireUser()
  const title = requiredText(data.title, 'Task title')
  if (!['low', 'medium', 'high'].includes(data.priority)) throw new Error('Choose a valid priority.')
  const db = await getDb()
  if (data.id) {
    const changed = await db.update(tasks).set({ title, priority: data.priority }).where(and(eq(tasks.id, data.id), eq(tasks.userId, user.id))).returning({ id: tasks.id })
    if (!changed.length) throw new Error('This task no longer exists. Refresh and try again.')
  } else {
    await db.insert(tasks).values({ id: crypto.randomUUID(), userId: user.id, title, priority: data.priority, completed: false, createdAt: new Date().toISOString() })
  }
  return { saved: true }
})
export const setTaskCompleted = createServerFn({ method: 'POST' }).validator((input: { id: string; completed: boolean }) => input).handler(async ({ data }) => {
  const user = await requireUser()
  if (typeof data.completed !== 'boolean') throw new Error('Choose a valid task status.')
  const db = await getDb()
  const changed = await db.update(tasks).set({ completed: data.completed }).where(and(eq(tasks.id, data.id), eq(tasks.userId, user.id))).returning({ id: tasks.id })
  if (!changed.length) throw new Error('This task no longer exists. Refresh and try again.')
  return { saved: true }
})
export const deleteTask = createServerFn({ method: 'POST' }).validator((input: { id: string }) => input).handler(async ({ data }) => {
  const user = await requireUser()
  const db = await getDb()
  await db.delete(tasks).where(and(eq(tasks.id, data.id), eq(tasks.userId, user.id)))
  return { deleted: true }
})
