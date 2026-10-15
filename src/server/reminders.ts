import { createServerFn } from '@tanstack/react-start'
import { and, eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { requireUser } from '@/lib/session.server'
import { reminders } from '@/db/schema'
import { requiredText } from '@/lib/validation'
import { validateReminderSchedule } from '@/lib/reminder-validation'
import type { ReminderSchedule } from '@/lib/reminder-validation'

export const addReminder = createServerFn({ method: 'POST' })
  .validator((input: ReminderSchedule & { title: string }) => input)
  .handler(async ({ data }) => {
    const user = await requireUser()
    const title = requiredText(data.title, 'Reminder title', 200)
    const scheduledAt = validateReminderSchedule(data, Date.now())
    const db = await getDb()
    await db.insert(reminders).values({ id: crypto.randomUUID(), userId: user.id, title, scheduledAt, timeZone: data.timeZone, createdAt: new Date().toISOString() })
    return { saved: true }
  })

export const deleteReminder = createServerFn({ method: 'POST' })
  .validator((input: { id: string }) => input)
  .handler(async ({ data }) => {
    const user = await requireUser()
    const db = await getDb()
    const removed = await db.delete(reminders).where(and(eq(reminders.id, requiredText(data.id, 'Reminder')), eq(reminders.userId, user.id))).returning({ id: reminders.id })
    if (!removed.length) throw new Error('This reminder is no longer available.')
    return { deleted: true }
  })
