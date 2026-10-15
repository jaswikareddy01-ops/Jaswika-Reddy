import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { currentUser, requireUser } from '@/lib/session.server'
import { profiles } from '@/db/schema'
import { normalizePhone, requiredText } from '@/lib/validation'

export const getIdentity = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await currentUser()
  if (!user) return null
  const db = await getDb()
  const profile = await db.select().from(profiles).where(eq(profiles.id, user.id)).get()
  return { user, profile: profile ?? null }
})

export const saveProfile = createServerFn({ method: 'POST' })
  .validator((input: { name: string; phone: string; accent: string; reducedMotion: boolean }) => input)
  .handler(async ({ data }) => {
    const user = await requireUser()
    const name = requiredText(data.name, 'Name', 80)
    const phone = normalizePhone(data.phone)
    if (!['cyan', 'violet'].includes(data.accent) || typeof data.reducedMotion !== 'boolean') throw new Error('Choose valid interface preferences.')
    const db = await getDb()
    const values = { id: user.id, name, phone, accent: data.accent, reducedMotion: data.reducedMotion }
    await db.insert(profiles).values(values).onConflictDoUpdate({ target: profiles.id, set: values })
    return { saved: true }
  })
