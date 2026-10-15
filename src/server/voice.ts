import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { profiles } from '@/db/schema'
import { getDb } from '@/lib/db'
import { requireUser } from '@/lib/session.server'

export const setSpokenReplies = createServerFn({ method: 'POST' })
  .validator((input: { enabled: boolean }) => {
    if (typeof input.enabled !== 'boolean') throw new Error('Choose a valid voice preference.')
    return input
  })
  .handler(async ({ data }) => {
    const user = await requireUser()
    const db = await getDb()
    const profile = await db.select().from(profiles).where(eq(profiles.id, user.id)).get()
    if (!profile) throw new Error('Complete your profile before saving voice preferences.')
    await db.update(profiles).set({ spokenReplies: data.enabled }).where(eq(profiles.id, user.id))
    return { enabled: data.enabled }
  })
