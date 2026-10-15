import { useState } from 'react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { Save, ShieldCheck, Palette, Trash2 } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Modal } from '@/components/Modal'
import { getWorkspace } from '@/server/workspace'
import { saveProfile } from '@/server/profile'
import { deleteMyAccount } from '@/server/settings'
import { addSampleData } from '@/server/sample-data'
import { browserTimeZone } from '@/lib/monstarx/calendar'
import { useAction } from '@/lib/actions'
import { authClient } from '@/lib/auth-client'

export const Route = createFileRoute('/settings')({
  loader: async () => { const workspace = await getWorkspace(); if (!workspace) throw redirect({ to: '/login' }); return workspace },
  component: SettingsPage,
})
function SettingsPage() {
  const workspace = Route.useLoaderData()
  const [name, setName] = useState(workspace.profile?.name ?? workspace.user.name)
  const [phone, setPhone] = useState(workspace.profile?.phone ?? '')
  const [accent, setAccent] = useState(workspace.profile?.accent ?? 'cyan')
  const [reducedMotion, setReducedMotion] = useState(workspace.profile?.reducedMotion ?? false)
  const [message, setMessage] = useState('')
  const [deleting, setDeleting] = useState(false)
  const save = useAction(saveProfile, { onSuccess: () => setMessage('Profile and interface preferences saved.') })
  const [sampleMessage, setSampleMessage] = useState('')
  const samples = useAction(async () => {
    const timeZone = browserTimeZone()
    if (!timeZone) throw new Error('Your time zone could not be read. Refresh and try again.')
    return addSampleData({ data: { timeZone } })
  }, { onSuccess: result => setSampleMessage(result.message) })
  return <AppShell workspace={workspace} page="Settings">
    <div className="page-heading"><div><div className="eyebrow">TUNED TO YOU</div><h1>Settings<span className="accent">.</span></h1><p>Edit your private profile, personalize your interface, or permanently delete your workspace.</p></div></div>
    <div className="settings-grid"><section className="panel settings-panel"><h2>Your profile & interface</h2><p>Changes apply across your workspace after you save.</p>
      <form onSubmit={event => { event.preventDefault(); setMessage(''); save.run({ data: { name, phone, accent, reducedMotion } }) }}><fieldset disabled={!save.ready} className="stack">
        <label>Your name<input required maxLength={80} autoComplete="name" value={name} onChange={event => { setName(event.target.value); setMessage('') }}/></label>
        <label>Phone number<input required type="tel" autoComplete="tel" maxLength={40} value={phone} onChange={event => { setPhone(event.target.value); setMessage('') }} placeholder="+1 202 555 0148"/></label>
        <p className="hint">8–15 digits, optionally starting with +. Your phone number is contact information, not identity verification.</p>
        <label>Email address<input type="email" value={workspace.user.email} readOnly/></label><p className="hint">Your sign-in email is shown for reference and cannot be changed here.</p>
        <label><span className="flex items-center gap-2"><Palette size={15}/> Interface accent</span><select value={accent} onChange={event => { setAccent(event.target.value); setMessage('') }}><option value="cyan">Arc blue</option><option value="violet">Cosmic violet</option></select></label>
        <label className="setting-choice"><span>Reduce motion<span className="hint block">Keep the assistant visual still and turn off transitions.</span></span><input type="checkbox" checked={reducedMotion} onChange={event => { setReducedMotion(event.target.checked); setMessage('') }}/></label>
        <p className="error" role="alert">{save.error}</p>{message && <p className="success" role="status">{message}</p>}
        <button className="btn-primary" type="submit"><Save size={16}/>{save.pending ? 'Saving…' : 'Save changes'}</button>
      </fieldset></form></section>
      <div className="settings-right"><section className="panel settings-panel"><ShieldCheck size={22} className="accent mb-4"/><h2>Your workspace, explained</h2><p>Tasks, notes, reminders, and profile details are private to your signed-in account. JARVIS uses built-in command rules, not an external AI service.</p><p>Reminders are displayed inside the app only. No texts, emails, push notifications, or background alerts are sent.</p><p className="hint">This web version uses the workspace’s supported stack and hosted SQLite storage. It is not an offline Python or Streamlit application.</p></section>
      <section className="panel settings-panel"><h2>Fictional starter data</h2><p>Add 4 tasks, 3 notes, and 2 in-app reminders to explore JARVIS. Every example is labeled [Sample] and can be edited or deleted in its manager.</p><p className="hint">Existing records are never replaced. Loading again does not duplicate existing samples. New reminders are scheduled 24 and 72 hours ahead in your time zone.</p><button className="btn-secondary" onClick={() => { setSampleMessage(''); samples.run() }}>{samples.pending ? 'Loading starter data…' : 'Load starter data'}</button><p className="error" role="alert">{samples.error}</p>{sampleMessage && <p className="success" role="status">{sampleMessage}</p>}</section>
      <section className="panel settings-panel danger-panel"><h2>Delete your account</h2><p>Permanently remove your profile, tasks, notes, reminders, and sign-in account. All signed-in sessions will lose access. This cannot be undone.</p><button className="btn-danger" onClick={() => setDeleting(true)}><Trash2 size={16}/> Delete account</button></section></div>
    </div>
    {deleting && <DeleteAccount onClose={() => setDeleting(false)}/>}
  </AppShell>
}
function DeleteAccount({ onClose }: { onClose: () => void }) {
  const [confirmation, setConfirmation] = useState('')
  const remove = useAction(deleteMyAccount, {
    refresh: false,
    onSuccess: () => {
      // The account and all sessions are already gone. Cookie cleanup is optional, never a failed deletion.
      void authClient.signOut().catch(() => undefined).finally(() => window.location.replace('/login'))
    },
  })
  return <Modal title="Permanently delete your account?" onClose={onClose}><p className="muted">Your profile, tasks, notes, reminders, and sign-in access will be permanently removed. You cannot recover them.</p><form onSubmit={event => { event.preventDefault(); remove.run({ data: { confirmation } }) }}><fieldset disabled={!remove.ready} className="stack"><label>Type DELETE to confirm<input required pattern="DELETE" autoComplete="off" value={confirmation} onChange={event => setConfirmation(event.target.value)} placeholder="DELETE"/></label><p className="error" role="alert">{remove.error}</p><div className="modal-actions"><button type="button" className="btn-secondary" onClick={onClose}>Keep my account</button><button className="btn-danger" type="submit">{remove.pending ? 'Deleting account…' : 'Delete permanently'}</button></div></fieldset></form></Modal>
}
