export * from './auth-schema'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { user } from './auth-schema'
export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey().references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(), phone: text('phone').notNull(),
  spokenReplies: integer('spoken_replies', { mode: 'boolean' }).notNull().default(false),
  accent: text('accent').notNull().default('cyan'), reducedMotion: integer('reduced_motion', { mode: 'boolean' }).notNull().default(false),
})
export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(), userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(), priority: text('priority').notNull().default('medium'), completed: integer('completed', { mode: 'boolean' }).notNull().default(false), createdAt: text('created_at').notNull(),
})
export const notes = sqliteTable('notes', {
  id: text('id').primaryKey(), userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(), content: text('content').notNull(), updatedAt: text('updated_at').notNull(),
})
export const reminders = sqliteTable('reminders', {
  id: text('id').primaryKey(), userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(), scheduledAt: text('scheduled_at').notNull(), timeZone: text('time_zone').notNull(), createdAt: text('created_at').notNull(),
})
export type Task = typeof tasks.$inferSelect
export type Note = typeof notes.$inferSelect
export type Reminder = typeof reminders.$inferSelect
export type Profile = typeof profiles.$inferSelect
