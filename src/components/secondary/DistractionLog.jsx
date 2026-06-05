import React, { useState } from 'react'
import { useFocusStore } from '../../store/focusStore.js'
import { useTimerStore } from '../../store/timerStore.js'
import { format } from 'date-fns'

export default function DistractionLog({ user }) {
  const distractions = useFocusStore(s => s.distractions)
  const logDistraction = useFocusStore(s => s.logDistraction)
  const { running, activeBlockId } = useTimerStore()
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState('')
  const [logging, setLogging] = useState(false)

  async function handleLog() {
    const text = label.trim() || 'Unnamed distraction'
    setLogging(true)
    await logDistraction(user.id, text, activeBlockId)
    setLabel('')
    setLogging(false)
  }

  return (
    <div className="rounded-[22px] overflow-hidden" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-sm)' }}>
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 w-full px-5 py-3.5 text-left"
      >
        <span className="material-symbols-rounded" style={{ fontSize: 17, color: 'var(--lav-deep)' }}>bolt</span>
        <span className="text-[11px] font-extrabold uppercase tracking-wider flex-1" style={{ color: 'var(--ink-2)' }}>Distractions</span>
        {distractions.length > 0 && (
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full" style={{ color: 'var(--lav-deep)', background: 'rgba(155,143,224,0.14)' }}>{distractions.length}</span>
        )}
        <span className="material-symbols-rounded" style={{ fontSize: 16, color: 'var(--ink-4)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>expand_more</span>
      </button>

      {/* Quick log */}
      <div className="px-5 pb-3.5 flex gap-2">
        <input
          type="text"
          value={label}
          onChange={e => setLabel(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleLog() }}
          placeholder={running ? 'Log what pulled you away…' : 'What distracted you?'}
          className="flex-1 rounded-xl px-3 py-2 text-xs font-medium outline-none"
          style={{ background: 'var(--canvas)', color: 'var(--ink)' }}
        />
        <button
          onClick={handleLog}
          disabled={logging}
          className="px-3 py-2 rounded-xl font-bold text-xs text-white transition-all disabled:opacity-50 flex-shrink-0"
          style={{ background: 'var(--lav-deep)' }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 15 }}>add</span>
        </button>
      </div>

      {/* Log list */}
      {open && distractions.length > 0 && (
        <div className="px-5 py-2.5 space-y-1.5 max-h-40 overflow-y-auto" style={{ borderTop: '1px solid var(--line)' }}>
          {distractions.map(d => (
            <div key={d.id} className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: 'var(--lav-deep)' }} />
              <span className="text-xs flex-1" style={{ color: 'var(--ink-2)' }}>{d.label}</span>
              <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--ink-4)' }}>
                {format(new Date(d.logged_at), 'h:mm a')}
              </span>
            </div>
          ))}
        </div>
      )}

      {open && distractions.length === 0 && (
        <p className="px-5 pb-3.5 text-xs" style={{ color: 'var(--ink-4)' }}>No distractions logged today. Keep it up.</p>
      )}
    </div>
  )
}
