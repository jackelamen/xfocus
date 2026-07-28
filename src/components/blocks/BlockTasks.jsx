import React, { useMemo, useState } from 'react'
import { useTasksByIds, usePulseTasks } from '../../hooks/usePulseTasks.js'
import toast from 'react-hot-toast'
import { pulseTaskUrl, inactiveReason, setTaskCompleted } from '../../lib/pulse.js'
import { dueBucket, dueLabel, formatMinutes } from '../../lib/utils.js'

const PRIORITY_STYLE = {
  urgent: { bg: 'rgba(255,155,115,0.16)', fg: 'var(--coral-deep)', label: 'Urgent' },
  high:   { bg: 'rgba(255,155,115,0.12)', fg: 'var(--coral-deep)', label: 'High' },
  low:    { bg: 'rgba(155,143,224,0.14)', fg: 'var(--lav-deep)',   label: 'Low' },
}

/**
 * Task list editor for a time block.
 *
 * `value` is `{ task_ids, task_names }` held by the parent form; every change
 * is reported through `onChange` so nothing persists until the form is saved.
 * Titles are re-read live from Pulse so a task renamed there shows its current
 * name, and tasks that were completed/archived/deleted in Pulse are flagged
 * rather than silently disappearing.
 */
export default function BlockTasks({ userId, value, onChange }) {
  const ids = value.task_ids || []
  const names = value.task_names || []
  const { taskMap, loading } = useTasksByIds(userId, ids)
  const { tasks: activeTasks } = usePulseTasks(userId)

  const [expanded, setExpanded] = useState(null)   // task id whose details are open
  const [adding, setAdding] = useState(false)
  const [query, setQuery] = useState('')

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase()
    return activeTasks
      .filter(t => !ids.includes(t.id))
      .filter(t => !q || t.title.toLowerCase().includes(q))
      .slice(0, 8)
  }, [activeTasks, ids, query])

  function removeAt(idx) {
    onChange({
      task_ids: ids.filter((_, i) => i !== idx),
      task_names: names.filter((_, i) => i !== idx),
    })
  }

  // Completion is written straight back to Pulse (the hooks refetch on bump).
  async function toggleDone(task) {
    const done = Boolean(task.completed_at || task.status === 'done')
    const { error } = await setTaskCompleted(task, !done)
    if (error) toast.error('Could not update task in Pulse')
    else toast.success(done ? 'Reopened in Pulse' : 'Completed in Pulse')
  }

  function add(task) {
    if (ids.includes(task.id)) return
    onChange({ task_ids: [...ids, task.id], task_names: [...names, task.title] })
    setQuery('')
    setAdding(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-[10px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>
          Tasks {ids.length > 0 && <span style={{ color: 'var(--ink-4)' }}>({ids.length})</span>}
        </label>
        <button
          type="button"
          onClick={() => setAdding(a => !a)}
          className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider"
          style={{ color: 'var(--lav-deep)' }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 13 }}>{adding ? 'close' : 'add'}</span>
          {adding ? 'Done' : 'Add'}
        </button>
      </div>

      {/* Attached tasks */}
      {ids.length === 0 ? (
        <p className="text-[11px] px-1 py-2" style={{ color: 'var(--ink-4)' }}>
          No tasks yet. Add one here, or drag a task from the Pulse panel onto this block.
        </p>
      ) : (
        <div className="space-y-1.5">
          {ids.map((id, idx) => {
            const live = taskMap.get(id)
            const title = live?.title || names[idx] || 'Untitled task'
            const stale = inactiveReason(live)
            const missing = !loading && !live
            const open = expanded === id
            const done = Boolean(live?.completed_at || live?.status === 'done')
            const prio = live?.priority && live.priority !== 'none' ? PRIORITY_STYLE[live.priority] : null

            return (
              <div
                key={`${id}-${idx}`}
                className="rounded-xl overflow-hidden"
                style={{ background: 'var(--canvas)', border: '1px solid var(--line-2)' }}
              >
                <div className="flex items-center gap-2 px-2.5 py-2">
                  <button
                    type="button"
                    onClick={() => live && toggleDone(live)}
                    disabled={!live}
                    className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 disabled:opacity-40"
                    style={{ color: done ? 'var(--sky-deep)' : 'var(--ink-4)' }}
                    title={!live ? 'Task not found in Pulse' : done ? 'Reopen in Pulse' : 'Complete in Pulse'}
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: 16 }}>
                      {done ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpanded(open ? null : id)}
                    className="flex-1 min-w-0 text-left"
                    title="Show details"
                  >
                    <p
                      className="text-xs font-medium truncate"
                      style={{ color: 'var(--ink)', textDecoration: stale ? 'line-through' : 'none', opacity: stale ? 0.6 : 1 }}
                    >
                      {title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {live?.list_name && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{
                          background: (live.list_color || '#9b8fe0') + '22',
                          color: live.list_color || 'var(--lav-deep)',
                        }}>
                          {live.list_name}
                        </span>
                      )}
                      {live?.due_date && (
                        <span className="text-[9px] font-bold" style={{
                          color: dueBucket(live.due_date) === 'overdue' ? 'var(--coral-deep)' : 'var(--ink-3)',
                        }}>
                          {dueLabel(live.due_date)}
                        </span>
                      )}
                      {prio && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded" style={{ background: prio.bg, color: prio.fg }}>
                          {prio.label}
                        </span>
                      )}
                      {stale && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(43,47,68,0.07)', color: 'var(--ink-3)' }}>
                          {stale}
                        </span>
                      )}
                      {missing && (
                        <span className="text-[9px] font-bold" style={{ color: 'var(--ink-4)' }}>Not found in Pulse</span>
                      )}
                    </div>
                  </button>

                  {live && (
                    <a
                      href={pulseTaskUrl(live)}
                      target="_blank"
                      rel="noreferrer"
                      className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ color: 'var(--lav-deep)' }}
                      title="Open in Pulse"
                    >
                      <span className="material-symbols-rounded" style={{ fontSize: 14 }}>open_in_new</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => removeAt(idx)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ color: 'var(--coral-deep)' }}
                    title="Remove from block"
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: 14 }}>close</span>
                  </button>
                </div>

                {open && (
                  <div className="px-2.5 pb-2.5 pt-0.5 space-y-1" style={{ borderTop: '1px solid var(--line-2)' }}>
                    {live?.notes && (
                      <p className="text-[11px] whitespace-pre-wrap pt-1.5" style={{ color: 'var(--ink-2)' }}>{live.notes}</p>
                    )}
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 pt-1">
                      {live?.status && <Detail label="Status" value={live.status} />}
                      {live?.duration_minutes ? <Detail label="Estimate" value={formatMinutes(live.duration_minutes)} /> : null}
                      {live?.start_at && <Detail label="Starts" value={new Date(live.start_at).toLocaleString()} />}
                      {live?.due_at && <Detail label="Due" value={new Date(live.due_at).toLocaleString()} />}
                    </div>
                    {live?.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {live.tags.map(tag => (
                          <span key={tag} className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(155,143,224,0.14)', color: 'var(--lav-deep)' }}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {!live && !loading && (
                      <p className="text-[11px] pt-1.5" style={{ color: 'var(--ink-3)' }}>
                        This task no longer exists in Pulse. Remove it to tidy up the block.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add-a-task picker */}
      {adding && (
        <div className="mt-2 rounded-xl overflow-hidden" style={{ background: 'var(--canvas)', border: '1px solid var(--line-2)' }}>
          <input
            autoFocus
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search open Pulse tasks…"
            className="w-full px-3 py-2 text-xs font-medium outline-none bg-transparent"
            style={{ color: 'var(--ink)', borderBottom: '1px solid var(--line-2)' }}
          />
          <div className="max-h-40 overflow-y-auto">
            {candidates.length === 0 ? (
              <p className="text-[11px] px-3 py-3" style={{ color: 'var(--ink-4)' }}>No matching open tasks.</p>
            ) : candidates.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => add(t)}
                className="w-full text-left px-3 py-2 flex items-center gap-2 transition-colors hover:bg-black/[0.03]"
              >
                <span className="material-symbols-rounded" style={{ fontSize: 13, color: 'var(--ink-4)' }}>add_circle</span>
                <span className="text-xs truncate flex-1" style={{ color: 'var(--ink)' }}>{t.title}</span>
                {t.due_date && (
                  <span className="text-[9px] font-bold flex-shrink-0" style={{ color: 'var(--ink-3)' }}>{dueLabel(t.due_date)}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <span className="text-[10px]" style={{ color: 'var(--ink-3)' }}>
      <span className="font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-4)' }}>{label}</span>{' '}
      {value}
    </span>
  )
}
