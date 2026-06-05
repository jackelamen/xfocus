import React from 'react'
import { TIMER_STYLES } from './TimerFace.jsx'

/* Compact, scrollable style switcher shared by inline + focus mode. */
export default function TimerStylePicker({ value, onChange, theme = 'light' }) {
  const dark = theme === 'dark'
  return (
    <div
      className="flex rounded-[13px] p-1 max-w-full overflow-x-auto no-scrollbar"
      style={{ background: dark ? 'rgba(255,255,255,0.05)' : 'var(--canvas)' }}
    >
      {TIMER_STYLES.map(s => {
        const activeStyle = dark
          ? { background: 'rgba(249,115,22,0.22)', color: '#ffb894' }
          : { background: 'var(--surface)', color: 'var(--coral-deep)', boxShadow: 'var(--shadow-sm)' }
        const idleColor = dark ? 'rgba(255,255,255,0.35)' : 'var(--ink-3)'
        return (
          <button
            key={s.id}
            onClick={() => onChange(s.id)}
            title={s.label}
            className="flex items-center gap-1.5 px-2.5 py-[6px] rounded-[10px] text-xs font-bold transition-all shrink-0"
            style={value === s.id ? activeStyle : { color: idleColor }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>{s.icon}</span>
            <span className="hidden sm:inline">{s.label}</span>
          </button>
        )
      })}
    </div>
  )
}
