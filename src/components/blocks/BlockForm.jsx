import React, { useState, useMemo } from 'react'
import { useBlocksStore } from '../../store/blocksStore.js'
import { FOCUS_TYPES, BLOCK_COLORS, timeToMinutes } from '../../lib/utils.js'
import { findConflicts, nextFreeSlot } from '../../lib/overlap.js'
import { HOUR_START, HOUR_END } from '../../lib/timeline.js'
import BlockTasks from './BlockTasks.jsx'
import toast from 'react-hot-toast'

export default function BlockForm({ user, initial, onClose }) {
  const createBlock = useBlocksStore(s => s.createBlock)
  const updateBlock = useBlocksStore(s => s.updateBlock)
  const deleteBlock = useBlocksStore(s => s.deleteBlock)
  const allBlocks = useBlocksStore(s => s.blocks)
  const viewDate = useBlocksStore(s => s.viewDate)

  const editing = !!initial?.id
  const blockDate = initial?.date || viewDate

  const [title, setTitle] = useState(initial?.title || '')
  const [startTime, setStartTime] = useState(initial?.start_time?.slice(0, 5) || '09:00')
  const [endTime, setEndTime] = useState(initial?.end_time?.slice(0, 5) || '10:00')
  const [color, setColor] = useState(initial?.color || '#ff9b73')
  const [focusType, setFocusType] = useState(initial?.focus_type || 'Other')
  const [notes, setNotes] = useState(initial?.notes || '')
  const [saving, setSaving] = useState(false)
  // Task edits are staged locally and committed with the rest of the form.
  const [taskSet, setTaskSet] = useState({
    task_ids: initial?.task_ids || [],
    task_names: initial?.task_names || [],
  })

  // Blocks on the same day that this one would clash with. Overlap is allowed
  // (a call inside a longer work window is legitimate) so this warns rather
  // than blocks, and offers to move to the next opening.
  const conflicts = useMemo(() => {
    if (startTime >= endTime) return []
    const sameDay = allBlocks.filter(b => b.date === blockDate)
    return findConflicts(
      sameDay,
      { start: timeToMinutes(startTime), end: timeToMinutes(endTime) },
      initial?.id || null
    )
  }, [allBlocks, blockDate, startTime, endTime, initial?.id])

  function moveToNextFree() {
    const durationMin = timeToMinutes(endTime) - timeToMinutes(startTime)
    const sameDay = allBlocks.filter(b => b.date === blockDate)
    const slot = nextFreeSlot(
      sameDay, durationMin, timeToMinutes(startTime), HOUR_END * 60, initial?.id || null
    )
    if (!slot) { toast.error('No free slot left today for that length'); return }
    setStartTime(slot.start_time)
    setEndTime(slot.end_time)
    toast.success(`Moved to ${slot.start_time}`)
  }

  async function handleSave() {
    if (!title.trim()) { toast.error('Add a title'); return }
    if (startTime >= endTime) { toast.error('End time must be after start time'); return }
    if (timeToMinutes(startTime) < HOUR_START * 60 || timeToMinutes(endTime) > HOUR_END * 60) {
      toast('Outside the visible timeline — it will save, but you won\'t see it')
    }
    setSaving(true)
    const payload = {
      title: title.trim(),
      start_time: startTime,
      end_time: endTime,
      color,
      focus_type: focusType,
      notes: notes || null,
      task_ids: taskSet.task_ids,
      task_names: taskSet.task_names,
    }
    if (editing) {
      await updateBlock(initial.id, payload)
      toast.success('Block updated')
    } else {
      await createBlock(user.id, payload)
      toast.success('Block created')
    }
    setSaving(false)
    onClose()
  }

  async function handleDelete() {
    if (!window.confirm('Delete this block?')) return
    await deleteBlock(initial.id)
    toast.success('Block deleted')
    onClose()
  }

  const label = "block text-[10px] font-extrabold uppercase tracking-wider mb-1.5"
  const field = { background: 'var(--canvas)', color: 'var(--ink)', border: '1px solid var(--line-2)' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(43,47,68,0.45)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-sm rounded-[24px] overflow-hidden" style={{ background: 'var(--surface)', boxShadow: '0 30px 70px rgba(70,90,140,0.35)' }}>
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between" style={{ background: color + '22' }}>
          <h3 className="font-extrabold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--ink)' }}>
            {editing ? 'Edit Block' : 'New Block'}
          </h3>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center transition-colors" style={{ color: 'var(--ink-3)' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>close</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className={label} style={{ color: 'var(--ink-3)' }}>Title</label>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
              placeholder="e.g. Deep work — feature spec"
              className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none"
              style={field}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label} style={{ color: 'var(--ink-3)' }}>Start</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" style={field} />
            </div>
            <div>
              <label className={label} style={{ color: 'var(--ink-3)' }}>End</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" style={field} />
            </div>
          </div>

          {conflicts.length > 0 && (
            <div className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,155,115,0.12)', border: '1px solid rgba(244,122,77,0.35)' }}>
              <div className="flex items-start gap-2">
                <span className="material-symbols-rounded flex-shrink-0" style={{ fontSize: 15, color: 'var(--coral-deep)' }}>warning</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold" style={{ color: 'var(--coral-deep)' }}>
                    Overlaps {conflicts.length} existing block{conflicts.length === 1 ? '' : 's'}
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {conflicts.slice(0, 3).map(c => (
                      <li key={c.id} className="text-[10px] truncate" style={{ color: 'var(--ink-2)' }}>
                        {String(c.start_time).slice(0, 5)}–{String(c.end_time).slice(0, 5)} · {c.title}
                      </li>
                    ))}
                    {conflicts.length > 3 && (
                      <li className="text-[10px]" style={{ color: 'var(--ink-3)' }}>+{conflicts.length - 3} more</li>
                    )}
                  </ul>
                  <button
                    type="button"
                    onClick={moveToNextFree}
                    className="mt-1.5 text-[10px] font-extrabold uppercase tracking-wider"
                    style={{ color: 'var(--lav-deep)' }}
                  >
                    Move to next free time
                  </button>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className={label} style={{ color: 'var(--ink-3)' }}>Color</label>
            <div className="flex gap-2 flex-wrap">
              {BLOCK_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full transition-transform active:scale-90"
                  style={{ background: c, outline: color === c ? '2px solid var(--ink-2)' : 'none', outlineOffset: 2 }}
                />
              ))}
            </div>
          </div>

          <BlockTasks userId={user.id} value={taskSet} onChange={setTaskSet} />

          <div>
            <label className={label} style={{ color: 'var(--ink-3)' }}>Focus type</label>
            <select value={focusType} onChange={e => setFocusType(e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" style={field}>
              {FOCUS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className={label} style={{ color: 'var(--ink-3)' }}>Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Context, goals…"
              className="w-full rounded-xl px-4 py-2.5 text-sm font-medium resize-none outline-none" style={field} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-2">
          {editing && (
            <button onClick={handleDelete} className="w-9 h-10 rounded-xl flex items-center justify-center transition-all" style={{ color: 'var(--coral-deep)', background: 'rgba(255,155,115,0.12)' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>delete</span>
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40"
            style={{ background: color }}
          >
            {saving
              ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              : <><span className="material-symbols-rounded text-base">save</span> {editing ? 'Update' : 'Create'}</>
            }
          </button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl font-bold text-sm transition-all" style={{ background: 'var(--canvas)', color: 'var(--ink-2)' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
