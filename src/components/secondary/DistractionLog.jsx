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
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.14)' }}>
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 w-full px-4 py-3 text-left"
      >
        <span className="material-symbols-rounded text-red-400 text-base">bolt</span>
        <span className="text-xs font-black uppercase tracking-widest text-red-400/80 flex-1">Distractions</span>
        {distractions.length > 0 && (
          <span className="text-[10px] font-black text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">{distractions.length}</span>
        )}
        <span className="material-symbols-rounded text-red-400/40 text-sm" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>expand_more</span>
      </button>

      {/* Quick log always visible if timer running */}
      <div className="px-4 pb-3 flex gap-2">
        <input
          type="text"
          value={label}
          onChange={e => setLabel(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleLog() }}
          placeholder={running ? 'Log what pulled you away…' : 'What distracted you?'}
          className="flex-1 rounded-xl px-3 py-2 text-xs font-medium placeholder-white/20 outline-none text-white"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}
        />
        <button
          onClick={handleLog}
          disabled={logging}
          className="px-3 py-2 rounded-xl font-bold text-xs text-white transition-all disabled:opacity-50 flex-shrink-0"
          style={{ background: 'rgba(239,68,68,0.3)' }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 15 }}>add</span>
        </button>
      </div>

      {/* Log list */}
      {open && distractions.length > 0 && (
        <div className="border-t px-4 py-2 space-y-1.5 max-h-40 overflow-y-auto" style={{ borderColor: 'rgba(239,68,68,0.1)' }}>
          {distractions.map(d => (
            <div key={d.id} className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: '#ef4444' }} />
              <span className="text-xs text-white/60 flex-1">{d.label}</span>
              <span className="text-[10px] text-white/25 flex-shrink-0">
                {format(new Date(d.logged_at), 'h:mm a')}
              </span>
            </div>
          ))}
        </div>
      )}

      {open && distractions.length === 0 && (
        <p className="px-4 pb-3 text-xs text-red-400/30">No distractions logged today. Keep it up.</p>
      )}
    </div>
  )
}
