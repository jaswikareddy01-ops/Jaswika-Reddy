import { useEffect, useState } from 'react'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { Bell, Plus, Trash2, CalendarDays } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Modal } from '@/components/Modal'
import { getWorkspace } from '@/server/workspace'
import { addReminder, deleteReminder } from '@/server/reminders'
import { useAction } from '@/lib/actions'
import { browserTimeZone } from '@/lib/monstarx/calendar'
import type { Reminder } from '@/db/schema'
import { reminderInstant } from '@/lib/reminder-time'

export const Route = createFileRoute('/reminders')({
  validateSearch: (input: Record<string, unknown>): { create?: boolean; view?: 'upcoming' | 'past' } => ({ create: input.create === true || input.create === 'true', view: input.view === 'past' ? 'past' : 'upcoming' }),
  loader: async () => { const workspace = await getWorkspace(); if (!workspace) throw redirect({ to: '/login' }); return workspace },
  component: Reminders,
})
function Reminders() {
  const workspace = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = useNavigate({ from: '/reminders' })
  const [now, setNow] = useState(workspace.now)
  const [message, setMessage] = useState('')
  useEffect(() => { setNow(new Date().toISOString()); const timer = window.setInterval(() => setNow(new Date().toISOString()), 15000); return () => window.clearInterval(timer) }, [])
  const past = search.view === 'past'
  const visible = workspace.reminders.filter(item => past ? item.scheduledAt <= now : item.scheduledAt > now)
  const close = () => { void navigate({ search: previous => ({ ...previous, create: false }), replace: true }) }
  return <AppShell workspace={workspace} page="Reminders">
    <div className="page-heading"><div><div className="eyebrow">A MOMENT AHEAD</div><h1>Reminders<span className="accent">.</span></h1><p>Save important moments and review upcoming reminders in your private workspace.</p></div><button className="btn-primary" onClick={() => { void navigate({ search: previous => ({ ...previous, create: true }) }) }}><Plus size={16}/> Set reminder</button></div>
    <div className="notice">In-app reminders only. No push notifications, texts, emails, or background alerts are sent. Each reminder shows its saved time zone; passed reminders move to Past &amp; due.</div>
    <div className="manager-toolbar"><div className="segmented" aria-label="Reminder view">{(['upcoming', 'past'] as const).map(view => <button key={view} className={(search.view ?? 'upcoming') === view ? 'selected' : ''} aria-pressed={(search.view ?? 'upcoming') === view} onClick={() => { void navigate({ search: previous => ({ ...previous, view }) }) }}>{view === 'upcoming' ? 'Upcoming' : 'Past & due'}</button>)}</div><span className="badge">{visible.length} {past ? 'past or due' : 'upcoming'}</span></div>
    {message && <p className="success" role="status">{message}</p>}
    {visible.length ? <div className="reminders-grid">{visible.map(item => <ReminderCard key={item.id} reminder={item} past={past} onDeleted={() => setMessage('Reminder deleted.')}/>)}</div> : <section className="panel empty"><Bell size={30}/><strong>{past ? 'No passed reminders.' : 'Nothing on the horizon.'}</strong><p>{past ? 'Reminders stay here after their scheduled time.' : 'Set a reminder with a title, date, and time.'}</p></section>}
    {search.create && <ReminderEditor onClose={close} onSaved={() => { setMessage('Reminder saved. You can review it here and on your dashboard.'); close() }}/>} 
  </AppShell>
}
function ReminderCard({ reminder, past, onDeleted }: { reminder: Reminder; past: boolean; onDeleted: () => void }) {
  const remove = useAction(deleteReminder, { onSuccess: onDeleted })
  return <article className="panel reminder-card"><span className="reminder-icon"><CalendarDays size={21}/></span><div className="reminder-detail"><h2>{reminder.title}</h2><p><time dateTime={reminder.scheduledAt}>{new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: reminder.timeZone }).format(new Date(reminder.scheduledAt))}</time><br/>{reminder.timeZone}</p><small>{past ? 'Scheduled time has passed' : 'Upcoming · In-app only'}</small><p className="error" role="alert">{remove.error}</p></div><button className="icon-button danger" aria-label={`Delete ${reminder.title}`} onClick={() => { if (window.confirm(`Delete “${reminder.title}”? This cannot be undone.`)) remove.run({ data: { id: reminder.id } }) }}>{remove.pending ? <span>Deleting…</span> : <Trash2 size={16}/>}</button></article>
}
function ReminderEditor({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [zone, setZone] = useState<string | null>(null)
  useEffect(() => { setZone(browserTimeZone()) }, [])
  const save = useAction(async () => {
    if (!zone) throw new Error('Your time zone could not be read. Refresh and try again.')
    const scheduledAt = reminderInstant(date, time, zone)
    return addReminder({ data: { title, date, time, scheduledAt, timeZone: zone } })
  }, { onSuccess: onSaved })
  return <Modal title="Set a reminder" onClose={onClose}><form onSubmit={event => { event.preventDefault(); save.run() }}><fieldset className="stack" disabled={!save.ready}><label>Title<input required maxLength={200} value={title} onChange={event => setTitle(event.target.value)} placeholder="Review my assignment"/></label><div className="form-row"><label>Date<input type="date" required max="9999-12-31" value={date} onChange={event => setDate(event.target.value)}/></label><label>Time<input type="time" required value={time} onChange={event => setTime(event.target.value)}/></label></div><p className="hint">Time zone: {zone ?? 'Detecting your time zone…'}. Choose a future time. Clocks changing forward can make some local times unavailable. When clocks repeat an hour, the first occurrence is used.</p><p className="hint">This saves an in-app reminder only. It does not send a notification.</p><p className="error" role="alert">{save.error}</p><div className="modal-actions"><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn-primary" type="submit">{save.pending ? 'Saving…' : 'Save reminder'}</button></div></fieldset></form></Modal>
}
