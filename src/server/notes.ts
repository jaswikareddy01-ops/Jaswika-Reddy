import { createServerFn } from '@tanstack/react-start'
import { and, eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { requireUser } from '@/lib/session.server'
import { notes } from '@/db/schema'
import { requiredText } from '@/lib/validation'

export const saveNote = createServerFn({ method: 'POST' }).validator((input: { id?: string; title: string; content: string }) => input).handler(async ({ data }) => {
  const user = await requireUser()
  const title = requiredText(data.title, 'Note title', 120)
  const content = requiredText(data.content, 'Note content', 20000)
  const db = await getDb()
  const values = { title, content, updatedAt: new Date().toISOString() }
  if (data.id) {
    const changed = await db.update(notes).set(values).where(and(eq(notes.id, data.id), eq(notes.userId, user.id))).returning({ id: notes.id })
    if (!changed.length) throw new Error('This note no longer exists. Refresh and try again.')
  } else {
    await db.insert(notes).values({ ...values, id: crypto.randomUUID(), userId: user.id })
  }
  return { saved: true }
})
export const deleteNote = createServerFn({ method: 'POST' }).validator((input: { id: string }) => input).handler(async ({ data }) => {
  const user = await requireUser()
  const db = await getDb()
  await db.delete(notes).where(and(eq(notes.id, data.id), eq(notes.userId, user.id)))
  return { deleted: true }
})
