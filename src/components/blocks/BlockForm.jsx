import React, { useState } from 'react'
import { useBlocksStore } from '../../store/blocksStore.js'
import { FOCUS_TYPES, BLOCK_COLORS } from '../../lib/utils.js'
import toast from 'react-hot-toast'

export default function BlockForm({ user, initial, onClose }) {
  const createBlock = useBlocksStore(s => s.createBlock)
  const updateBlock = useBlocksStore(s => s.updateBlock)
  const deleteBlock = useBlocksStore(s => s.deleteBlock)

  const editing = !!initial?.id

  const [title, setTitle] = useState(initial?.title || '')
  const [startTime, setStartTime] = useState(initial?.start_time?.slice(0, 5) || '09:00')
  const [endTime, setEndTime] = useState(initial?.end_time?.slice(0, 5) || '10:00')
  const [color, setColor] = useState(initial?.color || '#f97316')
  const [focusType, setFocusType] = useState(initial?.focus_type || 'Other')
  const [notes, setNotes] = useState(initial?.notes || '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!title.trim()) { toast.error('Add a title'); return }
    if (startTime >= endTime) { toast.error('End time must be after start time'); return }
    setSaving(true)
    const payload = { title: title.trim(), start_time: startTime, end_time: endTime, color, focus_type: focusType, notes: notes || null }
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl" style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)' }}>
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between" style={{ background: color + '20', borderBottom: `2px solid ${color}30` }}>
          <h3 className="font-black text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
            {editing ? 'Edit Block' : 'New Block'}
          </h3>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-white/70 transition-colors">
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>close</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">Title</label>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
              placeholder="e.g. Deep work — feature spec"
              className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white placeholder-white/25 outline-none"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>

          {/* Time range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">Start</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)', colorScheme: 'dark' }} />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">End</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)', colorScheme: 'dark' }} />
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {BLOCK_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full transition-transform active:scale-90"
                  style={{ background: c, outline: color === c ? `2px solid white` : 'none', outlineOffset: 2 }}
                />
              ))}
            </div>
          </div>

          {/* Focus type */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">Focus type</label>
            <select value={focusType} onChange={e => setFocusType(e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white outline-none"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)', colorScheme: 'dark' }}>
              {FOCUS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Context, goals…"
              className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white placeholder-white/20 resize-none outline-none"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-2">
          {editing && (
            <button onClick={handleDelete} className="w-9 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-red-500/20 text-red-400/60 hover:text-red-400">
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
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl font-bold text-sm transition-all" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
