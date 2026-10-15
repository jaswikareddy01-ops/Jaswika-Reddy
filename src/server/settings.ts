import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { requireUser } from '@/lib/session.server'
import { user } from '@/db/schema'

/** One owner-scoped deletion; SQLite's enforced foreign keys atomically remove child records. */
export const deleteMyAccount = createServerFn({ method: 'POST' })
  .validator((input: { confirmation: string }) => input)
  .handler(async ({ data }) => {
    const identity = await requireUser()
    if (data.confirmation !== 'DELETE') throw new Error('Type DELETE exactly to confirm permanent account deletion.')
    const db = await getDb()
    const removed = await db.delete(user).where(eq(user.id, identity.id)).returning({ id: user.id })
    if (!removed.length) throw new Error('This account is no longer available. Please sign out.')
    return { deleted: true }
  })
