import { useState } from 'react'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { Plus, ListTodo, Check, Pencil, Trash2, CheckCheck } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Modal } from '@/components/Modal'
import { TaskCommands } from '@/components/TaskCommands'
import { getWorkspace } from '@/server/workspace'
import { saveTask, setTaskCompleted, deleteTask } from '@/server/tasks'
import { useAction, useOptimisticAction } from '@/lib/actions'
import type { Task } from '@/db/schema'

type TaskSearch = { status?: 'all' | 'pending' | 'completed'; create?: boolean }
export const Route = createFileRoute('/tasks')({
  validateSearch: (input: Record<string, unknown>): TaskSearch => ({ status: input.status === 'pending' || input.status === 'completed' ? input.status : 'all', create: input.create === true || input.create === 'true' }),
  loader: async () => { const workspace = await getWorkspace(); if (!workspace) throw redirect({ to: '/login' }); return workspace },
  component: Tasks,
})
function Tasks() {
  const workspace = Route.useLoaderData()
  const { status = 'all', create = false } = Route.useSearch()
  const navigate = useNavigate({ from: '/tasks' })
  const list = workspace.tasks.filter(task => status === 'all' || (status === 'completed' ? task.completed : !task.completed))
  return <AppShell workspace={workspace} page="Tasks"><div className="page-heading"><div><div className="eyebrow">ONE THING AT A TIME</div><h1>Your tasks<span className="accent">.</span></h1><p>Turn the things on your mind into things you’ve done.</p></div><button className="btn-primary" onClick={() => void navigate({ search: { status, create: true } })}><Plus size={16}/> Add task</button></div><TaskCommands spokenReplies={workspace.profile?.spokenReplies ?? false}/><div className="manager-toolbar"><div className="segmented" aria-label="Filter tasks by status">{(['all', 'pending', 'completed'] as const).map(filter => <button key={filter} className={filter === status ? 'selected' : ''} aria-pressed={filter === status} onClick={() => void navigate({ search: { status: filter, create: false } })}>{filter[0]!.toUpperCase() + filter.slice(1)} <span className="muted">{workspace.tasks.filter(task => filter === 'all' || (filter === 'completed' ? task.completed : !task.completed)).length}</span></button>)}</div><span className="hint">Your pace. Your priorities.</span></div><section className="panel task-table"><div className="table-labels"><span>TASK</span><span>PRIORITY</span><span>ACTIONS</span></div>{list.map(task => <TaskRow key={task.id} task={task}/>)}{!list.length && <div className="empty"><CheckCheck size={30}/><strong>{status === 'completed' ? 'Your wins will appear here.' : 'A clear space for what’s next.'}</strong>{status === 'completed' ? 'Complete a task to see it here.' : 'Add your first task, or let JARVIS add one from the dashboard.'}</div>}</section>{create && <TaskEditor onClose={() => void navigate({ search: { status, create: false }, replace: true })}/>}</AppShell>
}
function TaskRow({ task }: { task: Task }) {
  const [edit, setEdit] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const toggle = useOptimisticAction({ value: task.completed, update: current => !current, action: () => setTaskCompleted({ data: { id: task.id, completed: !task.completed } }) })
  const remove = useAction(deleteTask)
  return <><div className="task-row"><button className={`check-button ${toggle.value ? 'checked' : ''}`} aria-label={toggle.value ? `Reopen ${task.title}` : `Complete ${task.title}`} aria-pressed={toggle.value} onClick={() => toggle.run()}>{toggle.value && <Check size={13}/>}</button><div className="task-text"><div className={`row-title ${toggle.value ? 'done' : ''}`}>{task.title}</div><div className="row-sub">{toggle.pending ? 'Saving status…' : toggle.value ? 'Completed — nicely done' : 'Pending · Ready when you are'}</div><p className="error" role="alert">{toggle.error || remove.error}</p></div><span className={`priority ${task.priority}`}>{task.priority}</span><div className="task-actions"><button className="icon-button" aria-label={`Edit ${task.title}`} onClick={() => setEdit(true)}><Pencil size={15}/></button><button className="icon-button danger" aria-label={`Delete ${task.title}`} onClick={() => setConfirmDelete(true)}><Trash2 size={15}/></button></div></div>{edit && <TaskEditor task={task} onClose={() => setEdit(false)}/>} {confirmDelete && <Modal title="Delete this task?" onClose={() => setConfirmDelete(false)}><p className="muted">“{task.title}” will be permanently removed.</p><p className="error" role="alert">{remove.error}</p><div className="modal-actions"><button className="btn-secondary" onClick={() => setConfirmDelete(false)}>Keep task</button><button className="btn-danger" onClick={() => remove.run({ data: { id: task.id } })}>{remove.pending ? 'Deleting…' : 'Delete task'}</button></div></Modal>}</>
}
function TaskEditor({ task, onClose }: { task?: Task; onClose: () => void }) {
  const [title, setTitle] = useState(task?.title ?? '')
  const [priority, setPriority] = useState(task?.priority ?? 'medium')
  const save = useAction(saveTask, { onSuccess: onClose })
  return <Modal title={task ? 'Edit task' : 'Make your next move'} onClose={onClose}><form onSubmit={event => { event.preventDefault(); save.run({ data: { id: task?.id, title, priority } }) }}><fieldset disabled={!save.ready} className="stack"><label>Task title<input required maxLength={200} value={title} onChange={event => setTitle(event.target.value)} placeholder="What would you like to get done?" autoFocus/></label><label>Priority<select value={priority} onChange={event => setPriority(event.target.value)}><option value="low">Low — whenever you can</option><option value="medium">Medium — keep it on your radar</option><option value="high">High — make this a focus</option></select></label><p className="error" role="alert">{save.error}</p><div className="modal-actions"><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn-primary"><ListTodo size={15}/>{save.pending ? 'Saving…' : task ? 'Save changes' : 'Add task'}</button></div></fieldset></form></Modal>
}
