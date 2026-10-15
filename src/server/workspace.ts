import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { currentUser, requireUser } from '@/lib/session.server'
import { profiles, tasks, notes, reminders } from '@/db/schema'
import { requiredText } from '@/lib/validation'
import { parseCommand, matchTask } from '@/lib/commands'

export const getWorkspace = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await currentUser()
  if (!user) return null
  const db = await getDb()
  const [profile, taskList, noteList, reminderList] = await Promise.all([
    db.select().from(profiles).where(eq(profiles.id, user.id)).get(),
    db.select().from(tasks).where(eq(tasks.userId, user.id)).orderBy(desc(tasks.createdAt)),
    db.select().from(notes).where(eq(notes.userId, user.id)).orderBy(desc(notes.updatedAt)),
    db.select().from(reminders).where(eq(reminders.userId, user.id)).orderBy(reminders.scheduledAt),
  ])
  return { user, profile: profile ?? null, tasks: taskList, notes: noteList, reminders: reminderList, now: new Date().toISOString() }
})

export const runCommand = createServerFn({ method: 'POST' }).validator((input: { command: string }) => input).handler(async ({ data }) => {
  const user = await requireUser()
  const input = requiredText(data.command, 'Command', 500)
  const command = parseCommand(input)
  const db = await getDb()
  if (command.type === 'addTask') {
    const title = requiredText(command.title, 'Task title')
    await db.insert(tasks).values({ id: crypto.randomUUID(), userId: user.id, title, priority: 'medium', completed: false, createdAt: new Date().toISOString() })
    return { message: `Added to your tasks: “${title}”.`, destination: '' }
  }
  if (command.type === 'completeTask') {
    const pending = await db.select().from(tasks).where(and(eq(tasks.userId, user.id), eq(tasks.completed, false)))
    const matches = matchTask(pending, command.query)
    if (!matches.length) return { message: 'I couldn’t find a pending task with that title. Try the exact task title.', destination: '' }
    if (matches.length > 1) return { message: 'More than one task matches. Use a more specific title, or complete it in Tasks.', destination: '' }
    await db.update(tasks).set({ completed: true }).where(and(eq(tasks.id, matches[0]!.id), eq(tasks.userId, user.id)))
    return { message: `Completed: “${matches[0]!.title}”. Nicely done.`, destination: '' }
  }
  if (command.type === 'tasks') return { message: `Opening your pending tasks.`, destination: 'tasks' }
  if (command.type === 'notes') return { message: 'Let’s capture that thought.', destination: 'notes' }
  if (command.type === 'reminders') return { message: 'Opening your reminders.', destination: 'reminders' }
  return { message: 'Try “Add a task to finish my assignment”, “Show my pending tasks”, “Create a note”, “Show my reminders”, or “Mark finish my assignment as completed”. Commands use built-in rules, not a generative AI service.', destination: '' }
})
