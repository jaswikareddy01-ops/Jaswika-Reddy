import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { CommandInput } from './CommandInput'
import { useAction } from '@/lib/actions'
import { runCommand } from '@/server/workspace'
import { useVoice } from './Voice'

/** Keep the assistant reachable after its pending-list command opens Tasks. */
export function TaskCommands({ spokenReplies = false }: { spokenReplies?: boolean }) {
  const voice = useVoice()
  const navigate = useNavigate()
  const [command, setCommand] = useState('')
  const [response, setResponse] = useState('')
  const action = useAction(runCommand, { onSuccess: result => {
    voice.speak(result.message, spokenReplies)
    setResponse(result.message)
    setCommand('')
    if (result.destination === 'tasks') void navigate({ to: '/tasks', search: { status: 'pending', create: false } })
    if (result.destination === 'notes') void navigate({ to: '/notes', search: { q: '', create: true } })
    if (result.destination === 'reminders') void navigate({ to: '/reminders', search: { create: false } })
  } })
  return <section className="panel command-zone mb-6" aria-label="Your personal assistant">
    <CommandInput value={command} onChange={setCommand} pending={action.pending} ready={action.ready} onSend={text => action.run({ data: { command: text } })}/>
    <p className="hint">Keep going: “Mark my assignment as completed”.</p>
    {response && <p className="command-response" role="status">{response}</p>}
    <p className="error" role="alert">{action.error}</p>
  </section>
}
