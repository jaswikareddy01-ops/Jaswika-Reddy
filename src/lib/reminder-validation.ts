import { calendarDateKey } from '@/lib/monstarx/calendar'

export interface ReminderSchedule {
  date: string
  time: string
  scheduledAt: string
  timeZone: string
}

/** Verify the browser's wall-clock choice against its explicit zone on the server. */
export function validateReminderSchedule(input: ReminderSchedule, now: number): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || !/^\d{2}:\d{2}$/.test(input.time)) throw new Error('Choose a valid date and time.')
  const wall = new Date(`${input.date}T${input.time}:00.000Z`)
  if (!Number.isFinite(wall.getTime()) || wall.toISOString() !== `${input.date}T${input.time}:00.000Z`) throw new Error('Choose a valid calendar date and time.')
  const instant = new Date(input.scheduledAt)
  if (!Number.isFinite(instant.getTime()) || instant.toISOString() !== input.scheduledAt) throw new Error('Choose a valid reminder time.')
  let day: string
  let time: string
  try {
    if (!input.timeZone || input.timeZone.length > 100) throw new Error('Invalid zone')
    day = calendarDateKey(input.scheduledAt, input.timeZone)
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: input.timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(instant)
    time = `${parts.find(part => part.type === 'hour')?.value}:${parts.find(part => part.type === 'minute')?.value}`
  } catch {
    throw new Error('Your time zone could not be read. Refresh the page and try again.')
  }
  if (day !== input.date || time !== input.time) throw new Error('That local time does not exist or does not match your time zone. Choose another time.')
  if (instant.getTime() <= now) throw new Error('Choose a date and time in the future.')
  return instant.toISOString()
}
