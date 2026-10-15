import { useEffect, useState } from 'react'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { MessageSquare, Copy, ShieldCheck } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { getWorkspace } from '@/server/workspace'
import { saveTask } from '@/server/tasks'
import { saveNote } from '@/server/notes'
import { addReminder } from '@/server/reminders'
import { useAction } from '@/lib/actions'
import { copyText } from '@/lib/monstarx/clipboard'
import { browserTimeZone } from '@/lib/monstarx/calendar'
import { notificationResponse } from '@/lib/notification-response'
import { reminderInstant } from '@/lib/reminder-time'

export const Route = createFileRoute('/notifications')({
  loader: async () => { const workspace = await getWorkspace(); if (!workspace) throw redirect({ to: '/login' }); return workspace },
  component: Notifications,
})
function Notifications() {
  const workspace = Route.useLoaderData()
  const [text, setText] = useState('')
  const [draft, setDraft] = useState('')
  const [reason, setReason] = useState('')
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<'task' | 'note' | 'reminder'>('task')
  const [priority, setPriority] = useState('medium')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [zone, setZone] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [savedKind, setSavedKind] = useState<'task' | 'note' | 'reminder' | null>(null)
  useEffect(() => { setZone(browserTimeZone()) }, [])
  const suggest = useAction(async () => {
    const result = notificationResponse(text)
    setDraft(result.draft); setReason(result.reason); setTitle(result.title); setMessage(''); setSavedKind(null)
    return { suggested: true }
  })
  const copy = useAction(async () => {
    if (!draft.trim()) throw new Error('Write or generate a reply before copying.')
    await copyText(draft)
    return { copied: true }
  }, { onSuccess: () => setMessage('Reply copied. Paste it into the original app, review it, and send it yourself.') })
  const save = useAction(async (approvedTitle: string) => {
    notificationResponse(text)
    const selectedKind = kind
    if (selectedKind === 'task') await saveTask({ data: { title: approvedTitle, priority } })
    else if (selectedKind === 'note') await saveNote({ data: { title: approvedTitle, content: text.trim() } })
    else {
      if (!zone) throw new Error('Your time zone could not be read. Refresh and try again.')
      const scheduledAt = reminderInstant(date, time, zone)
      await addReminder({ data: { title: approvedTitle, date, time, scheduledAt, timeZone: zone } })
    }
    return { kind: selectedKind }
  }, { onSuccess: result => { setSavedKind(result.kind); setMessage(`Your ${result.kind} was saved in your private workspace.`) } })
  return <AppShell workspace={workspace} page="Notifications">
    <div className="page-heading"><div><div className="eyebrow">READ. REVIEW. RESPOND.</div><h1>Notification workspace<span className="accent">.</span></h1><p>Paste a notification to prepare a reply or save a task, note, or reminder.</p></div><MessageSquare className="accent" size={30}/></div>
    <div className="notice"><strong>Android &amp; Mac · Manual paste only.</strong> This website cannot read other apps’ notifications, monitor your device, or send replies. Automatic capture needs separate companion software and is not connected here.</div>
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="panel p-5"><h2>1. Paste the message</h2><p className="muted">Only share text you are allowed to use. Remove passwords, verification codes, and private financial details first.</p><form onSubmit={event => { event.preventDefault(); suggest.run() }}><fieldset className="grid gap-4" disabled={!suggest.ready}><label>Notification text<textarea required maxLength={5000} value={text} onChange={event => { setText(event.target.value); setReason(''); setDraft(''); setMessage(''); setSavedKind(null) }} placeholder="Paste notification text from Android or Mac…"/></label><p className="hint">Text stays on this page until you explicitly save it. Leaving or reloading clears unsaved text.</p><button className="btn-primary" type="submit">{suggest.pending ? 'Preparing…' : 'Prepare reply & title'}</button><p className="error" role="alert">{suggest.error}</p></fieldset></form></section>
      <section className="panel p-5"><h2>2. Review your reply</h2><p className="muted">Built-in keyword templates, not AI analysis. Suggestions may miss context; nothing is sent automatically.</p>{reason && <p className="notice">{reason}</p>}<div className="grid gap-4"><label>Editable reply<textarea maxLength={5000} value={draft} onChange={event => { setDraft(event.target.value); setMessage('') }} placeholder="Prepare a suggestion or write your own reply…"/></label><button className="btn-secondary" onClick={() => copy.run()}><Copy size={15}/>{copy.pending ? 'Copying…' : 'Copy reply'}</button><p className="error" role="alert">{copy.error}</p></div></section>
      <section className="panel p-5 lg:col-span-2"><h2>3. Save only what you approve</h2><p className="muted">A task or reminder saves the title only. A note saves the title and pasted notification. The reply draft is never saved or sent.</p><form onSubmit={event => { event.preventDefault(); const approvedTitle = String(new FormData(event.currentTarget).get('title') ?? ''); setMessage(''); setSavedKind(null); save.run(approvedTitle) }}><fieldset className="grid gap-4" disabled={!save.ready}><div className="grid gap-4 sm:grid-cols-2"><label>Save as<select value={kind} onChange={event => setKind(event.target.value as typeof kind)}><option value="task">Task</option><option value="note">Note</option><option value="reminder">Reminder</option></select></label><label htmlFor="notification-save-title">Title<input id="notification-save-title" name="title" required maxLength={kind === 'note' ? 120 : 200} value={title} onChange={event => setTitle(event.target.value)} placeholder="Review notification"/></label></div>{kind === 'task' && <label>Priority<select value={priority} onChange={event => setPriority(event.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>}{kind === 'reminder' && <><div className="grid gap-4 sm:grid-cols-2"><label>Date<input type="date" required max="9999-12-31" value={date} onChange={event => setDate(event.target.value)}/></label><label>Time<input type="time" required value={time} onChange={event => setTime(event.target.value)}/></label></div><p className="hint">Time zone: {zone ?? 'Detecting…'}. Choose a future time; dates are not extracted from messages. In-app reminder only, with no background alerts. When clocks repeat an hour, the first occurrence is used.</p></>}<div><button className="btn-primary" type="submit"><ShieldCheck size={16}/>{save.pending ? 'Saving…' : `Approve & save ${kind}`}</button></div><p className="error" role="alert">{save.error}</p></fieldset></form></section>
    </div>
    <div role="status" aria-live="polite">{message && <p className="success">{message} {savedKind === 'task' && <Link to="/tasks" className="accent">Open Tasks →</Link>}{savedKind === 'note' && <Link to="/notes" className="accent">Open Notes →</Link>}{savedKind === 'reminder' && <Link to="/reminders" className="accent">Open Reminders →</Link>}</p>}</div>
  </AppShell>
}
