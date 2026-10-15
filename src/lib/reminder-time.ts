/** Resolve a wall-clock selection in its explicit IANA zone, not the runtime's local zone. */
export function reminderInstant(date: string, time: string, timeZone: string): string {
  const wallText = `${date}T${time}:00.000Z`
  const wall = new Date(wallText).getTime()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time) || !Number.isFinite(wall) || new Date(wall).toISOString() !== wallText) {
    throw new Error('Choose a valid date and time.')
  }
  if (!timeZone || timeZone.length > 100 || /^[+-]/.test(timeZone)) throw new Error('Your time zone could not be read. Refresh and try again.')
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone, calendar: 'gregory', numberingSystem: 'latn',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  })
  const wallAt = (instant: number): number => {
    const parts = formatter.formatToParts(new Date(instant))
    const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(value => value.type === type)!.value
    return new Date(`${part('year').padStart(4, '0')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}:${part('second')}.000Z`).getTime()
  }
  // Sample both sides of nearby clock changes, then verify every possible offset.
  // Sorting candidates selects the first occurrence when an hour repeats.
  const offsets = new Set<number>()
  for (let hours = -48; hours <= 48; hours += 6) {
    const probe = wall + hours * 3600000
    offsets.add(wallAt(probe) - probe)
  }
  const candidates = [...offsets].map(offset => wall - offset).filter(instant => wallAt(instant) === wall).sort((a, b) => a - b)
  if (!candidates.length) throw new Error('That local time does not exist in your time zone. Choose another time.')
  return new Date(candidates[0]!).toISOString()
}
