import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { setTaskCompleted, pulseTaskUrl } from '../../lib/pulse.js'

/**
 * One task inside a timeline block: a checkbox that writes completion straight
 * back to Pulse, the (live) title, an open-in-Pulse link and a remove button.
 *
 * `task` is the live Pulse row when we have it; `fallbackName` is the
 * denormalized name stored on the block, used when the task is gone.
 */
export default function TaskChip({ task, fallbackName, onRemove, compact = false }) {
  const [busy, setBusy] = useState(false)
  const done = Boolean(task?.completed_at || task?.status === 'done')
  const title = task?.title || fallbackName || 'Untitled task'
  const missing = !task

  async function toggle(e) {
    e.stopPropagation()
    if (!task || busy) return
    setBusy(true)
    const { error } = await setTaskCompleted(task, !done)
    setBusy(false)
    if (error) toast.error('Could not update task in Pulse')
    else toast.success(done ? 'Reopened in Pulse' : 'Completed in Pulse')
  }

  return (
    <div
      className="group/chip flex items-center gap-1 rounded-md px-1 min-w-0"
      style={{ background: 'rgba(255,255,255,0.55)', height: compact ? 16 : 18 }}
    >
      <button
        type="button"
        onClick={toggle}
        disabled={missing || busy}
        className="flex-shrink-0 flex items-center justify-center disabled:opacity-40"
        style={{ color: done ? 'var(--sky-deep)' : 'var(--ink-4)', width: 12, height: 12 }}
        title={missing ? 'Task not found in Pulse' : done ? 'Reopen in Pulse' : 'Complete in Pulse'}
      >
        <span className="material-symbols-rounded" style={{ fontSize: 12 }}>
          {done ? 'check_circle' : 'radio_button_unchecked'}
        </span>
      </button>

      <span
        className="flex-1 min-w-0 truncate"
        style={{
          fontSize: compact ? 8 : 9,
          color: 'var(--ink-2)',
          textDecoration: done ? 'line-through' : 'none',
          opacity: done ? 0.55 : 1,
        }}
        title={title}
      >
        {title}
      </span>

      {task && (
        <a
          href={pulseTaskUrl(task)}
          target="_blank"
          rel="noreferrer"
          onClick={e => e.stopPropagation()}
          onPointerDown={e => e.stopPropagation()}
          className="flex-shrink-0 opacity-0 group-hover/chip:opacity-100 transition-opacity"
          style={{ color: 'var(--lav-deep)' }}
          title="Open in Pulse"
        >
          <span className="material-symbols-rounded" style={{ fontSize: 11 }}>open_in_new</span>
        </a>
      )}

      {onRemove && (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onRemove() }}
          onPointerDown={e => e.stopPropagation()}
          className="flex-shrink-0 opacity-0 group-hover/chip:opacity-100 transition-opacity"
          style={{ color: 'var(--coral-deep)' }}
          title="Remove from block"
        >
          <span className="material-symbols-rounded" style={{ fontSize: 11 }}>close</span>
        </button>
      )}
    </div>
  )
}
