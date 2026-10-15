import { useState } from 'react'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { Plus, FileText, Search, Pencil, Trash2, LockKeyhole } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Modal } from '@/components/Modal'
import { getWorkspace } from '@/server/workspace'
import { saveNote, deleteNote } from '@/server/notes'
import { useAction } from '@/lib/actions'
import type { Note } from '@/db/schema'

export const Route = createFileRoute('/notes')({
  validateSearch: (input: Record<string, unknown>): { q?: string; create?: boolean } => ({ q: typeof input.q === 'string' ? input.q.slice(0, 200) : '', create: input.create === true || input.create === 'true' }),
  loader: async () => { const workspace = await getWorkspace(); if (!workspace) throw redirect({ to: '/login' }); return workspace },
  component: NotesPage,
})
function NotesPage() {
  const workspace = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = useNavigate({ from: '/notes' })
  const [editing, setEditing] = useState<Note | null>(null)
  const query = (search.q ?? '').toLowerCase().trim()
  const visible = workspace.notes.filter(note => `${note.title} ${note.content}`.toLowerCase().includes(query))
  const close = () => { setEditing(null); void navigate({ search: previous => ({ ...previous, create: false }), replace: true }) }
  return <AppShell workspace={workspace} page="Notes"><div className="page-heading"><div><div className="eyebrow">A HOME FOR YOUR THOUGHTS</div><h1>Personal notes<span className="accent">.</span></h1><p>Create, search, and organize notes in your private workspace.</p></div><button className="btn-primary" onClick={() => { void navigate({ search: previous => ({ ...previous, create: true }) }) }}><Plus size={16}/> New note</button></div><div className="manager-toolbar"><span className="badge"><LockKeyhole size={12}/>{workspace.notes.length} private notes</span><label className="search-box"><span className="sr-only">Search notes</span><Search size={15}/><input type="search" placeholder="Search your thoughts…" value={search.q ?? ''} onChange={event => { void navigate({ search: previous => ({ ...previous, q: event.target.value }), replace: true }) }}/></label></div>{visible.length ? <div className="notes-grid">{visible.map(note => <NoteCard key={note.id} note={note} onEdit={() => setEditing(note)}/>)}</div> : <section className="panel empty"><FileText size={30}/><strong>{query ? 'No matching thoughts.' : 'Your next idea starts here.'}</strong><p>{query ? 'Try another word or clear your search.' : 'Create your first private note with the New note button.'}</p></section>}{(editing || search.create) && <NoteEditor key={editing?.id ?? 'new'} note={editing} onClose={close}/>}</AppShell>
}
function NoteCard({ note, onEdit }: { note: Note; onEdit: () => void }) {
  const remove = useAction(deleteNote)
  return <article className="panel note-card"><FileText size={20}/><h2>{note.title}</h2><p className="note-content">{note.content}</p><div className="note-card-footer"><span className="note-meta">Updated {new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(note.updatedAt))} · UTC</span><button className="icon-button" aria-label={`Edit ${note.title}`} onClick={onEdit}><Pencil size={15}/></button><button className="icon-button danger" aria-label={`Delete ${note.title}`} onClick={() => { if (window.confirm(`Delete “${note.title}”? This cannot be undone.`)) remove.run({ data: { id: note.id } }) }}>{remove.pending ? <span>Deleting…</span> : <Trash2 size={15}/>}</button></div><p className="error" role="alert">{remove.error}</p></article>
}
function NoteEditor({ note, onClose }: { note: Note | null; onClose: () => void }) {
  const [title, setTitle] = useState(note?.title ?? '')
  const [content, setContent] = useState(note?.content ?? '')
  const save = useAction(saveNote, { onSuccess: onClose })
  return <Modal title={note ? 'Edit your note' : 'Capture a thought'} onClose={onClose}><form onSubmit={event => { event.preventDefault(); save.run({ data: { id: note?.id, title, content } }) }}><fieldset disabled={!save.ready} className="stack"><label>Title<input required maxLength={120} value={title} onChange={event => setTitle(event.target.value)} placeholder="Ideas worth exploring"/></label><label>Your thoughts<textarea required maxLength={20000} value={content} onChange={event => setContent(event.target.value)} placeholder="Let your ideas take shape…"/></label><p className="hint">Only you can access this note.</p><p className="error" role="alert">{save.error}</p><div className="modal-actions"><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn-primary" type="submit">{save.pending ? 'Saving…' : 'Save note'}</button></div></fieldset></form></Modal>
}
