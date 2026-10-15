export type Command = { type: 'addTask'; title: string } | { type: 'completeTask'; query: string } | { type: 'tasks' | 'notes' | 'reminders' | 'help' }
export function parseCommand(input: string): Command {
  const text = input.trim().replace(/[.!?]+$/, '').trim()
  const add = text.match(/^(?:please\s+)?add\s+(?:a\s+)?task(?:\s+to)?[\s:]+(.+)$/i)
  if (add?.[1]) return { type: 'addTask', title: add[1].trim() }
  const complete = text.match(/^mark\s+(.+?)\s+(?:as\s+)?(?:completed|complete|done)$/i)
  if (complete?.[1]) return { type: 'completeTask', query: complete[1].trim() }
  if (/^(?:show|list)(?:\s+me)?\s+(?:my\s+)?(?:pending\s+)?tasks$/i.test(text)) return { type: 'tasks' }
  if (/^(?:create|add)\s+(?:a\s+)?note$/i.test(text)) return { type: 'notes' }
  if (/^(?:show|list)(?:\s+me)?\s+(?:my\s+)?reminders$/i.test(text)) return { type: 'reminders' }
  return { type: 'help' }
}
export function matchTask<T extends { title: string }>(items: T[], query: string): T[] {
  const normalize = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim()
  const q = normalize(query)
  if (!q) return []
  const exact = items.filter(item => normalize(item.title) === q)
  return exact.length ? exact : items.filter(item => normalize(item.title).includes(q))
}
