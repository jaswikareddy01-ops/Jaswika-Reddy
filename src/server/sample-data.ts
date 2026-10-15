import { createServerFn } from '@tanstack/react-start'
import { getDb } from '@/lib/db'
import { requireUser } from '@/lib/session.server'
import { tasks, notes, reminders } from '@/db/schema'

export const addSampleData = createServerFn({ method: 'POST' }).validator((input: { timeZone: string }) => input).handler(async ({ data }) => {
  const user = await requireUser()
  try { new Intl.DateTimeFormat('en', { timeZone: data.timeZone }).format(new Date()) } catch { throw new Error('Your time zone could not be read. Refresh and try again.') }
  const db = await getDb()
  const now = new Date()
  const timestamp = now.toISOString()
  const id = (kind: string, index: number) => `jarvis-sample:${user.id}:${kind}:${index}`
  await db.insert(tasks).values([
    { id: id('task', 1), userId: user.id, title: '[Sample] Finish my assignment', priority: 'high', completed: false, createdAt: timestamp },
    { id: id('task', 2), userId: user.id, title: '[Sample] Plan next week’s study sessions', priority: 'medium', completed: false, createdAt: timestamp },
    { id: id('task', 3), userId: user.id, title: '[Sample] Organize my desk', priority: 'low', completed: false, createdAt: timestamp },
    { id: id('task', 4), userId: user.id, title: '[Sample] Review chapter one', priority: 'medium', completed: true, createdAt: timestamp },
  ]).onConflictDoNothing()
  await db.insert(notes).values([
    { id: id('note', 1), userId: user.id, title: '[Sample] Assignment outline', content: 'Fictional example: Introduce the topic, compare two approaches, include supporting examples, and finish with a short conclusion. Review the draft before submitting.', updatedAt: timestamp },
    { id: id('note', 2), userId: user.id, title: '[Sample] Weekly focus', content: 'Fictional example: Choose one important task each morning. Keep study sessions short, take breaks, and review what worked at the end of the week.', updatedAt: timestamp },
    { id: id('note', 3), userId: user.id, title: '[Sample] Ideas to explore', content: 'Fictional example: Build a reading list, try a new recipe, and sketch a personal project. These are starter ideas, not real commitments.', updatedAt: timestamp },
  ]).onConflictDoNothing()
  await db.insert(reminders).values([
    { id: id('reminder', 1), userId: user.id, title: '[Sample] Review assignment draft', scheduledAt: new Date(now.getTime() + 86400000).toISOString(), timeZone: data.timeZone, createdAt: timestamp },
    { id: id('reminder', 2), userId: user.id, title: '[Sample] Plan the coming week', scheduledAt: new Date(now.getTime() + 3 * 86400000).toISOString(), timeZone: data.timeZone, createdAt: timestamp },
  ]).onConflictDoNothing()
  return { message: 'Starter data loaded: up to 4 tasks, 3 notes, and 2 reminders. Existing items were kept; previously loaded samples were not duplicated.' }
})
