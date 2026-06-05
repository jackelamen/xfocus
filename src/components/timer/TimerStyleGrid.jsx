import React from 'react'
import { TIMER_STYLES } from './TimerFace.jsx'

/* Wrapped grid of timer styles — every option visible at once, no scrolling.
   Used inside the timer-settings popover (inline + focus mode). */
export default function TimerStyleGrid({ value, onChange, theme = 'light' }) {
  const dark = theme === 'dark'
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
      {TIMER_STYLES.map(s => {
        const active = value === s.id
        const activeStyle = dark
          ? { background: 'rgba(249,115,22,0.22)', color: '#ffb894', border: '1px solid rgba(249,115,22,0.4)' }
          : { background: 'rgba(255,126,77,0.12)', color: 'var(--coral-deep)', border: '1px solid rgba(255,126,77,0.35)' }
        const idleStyle = dark
          ? { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.55)', border: '1px solid transparent' }
          : { background: 'var(--canvas)', color: 'var(--ink-3)', border: '1px solid transparent' }
        return (
          <button
            key={s.id}
            onClick={() => onChange(s.id)}
            title={s.label}
            className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl text-xs font-bold transition-all"
            style={active ? activeStyle : idleStyle}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 20 }}>{s.icon}</span>
            <span className="text-[11px] leading-none">{s.label}</span>
          </button>
        )
      })}
    </div>
  )
}
