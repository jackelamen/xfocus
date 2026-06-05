import React, { useState, useEffect } from 'react'
import { useTimerStore } from '../../store/timerStore.js'
import { formatTime } from '../../lib/utils.js'
import TaskSelector from './TaskSelector.jsx'
import TimerFace, { TIMER_STYLES, STYLE_STORAGE_KEY } from './TimerFace.jsx'
import TimerStylePicker from './TimerStylePicker.jsx'

const MODES = [
  { id: 'pomodoro', label: 'Pomodoro' },
  { id: 'flow', label: 'Flow' },
  { id: 'custom', label: 'Custom' },
]

export default function FocusTimer({ onComplete, user }) {
  const {
    mode, strict, plannedMins, elapsedSecs, running, overtime,
    start, pause, stop, reset, extend, setMode, setDuration, setStrict,
  } = useTimerStore()

  const [tStyle, setTStyle] = useState('ring')
  useEffect(() => {
    try {
      const s = localStorage.getItem(STYLE_STORAGE_KEY)
      if (s && TIMER_STYLES.some(t => t.id === s)) setTStyle(s)
    } catch { /* ignore */ }
  }, [])
  const pickStyle = (id) => {
    setTStyle(id)
    try { localStorage.setItem(STYLE_STORAGE_KEY, id) } catch { /* ignore */ }
  }

  const plannedSecs = mode === 'flow' ? 0 : plannedMins * 60
  const remaining = Math.max(0, plannedSecs - elapsedSecs)
  const overtimeSecs = Math.max(0, elapsedSecs - plannedSecs)
  const progress = mode === 'flow' ? 0 : plannedSecs > 0 ? Math.min(1, elapsedSecs / plannedSecs) : 0
  const idle = !running && elapsedSecs === 0

  const display = mode === 'flow'
    ? formatTime(elapsedSecs)
    : overtime
      ? `+${formatTime(overtimeSecs)}`
      : formatTime(remaining)

  const stateLabel = idle
    ? (mode === 'flow' ? 'open-ended' : mode === 'custom' ? 'custom timer' : 'ready')
    : !running
      ? 'paused'
      : overtime
        ? 'still going'
        : mode === 'flow'
          ? 'flowing'
          : 'in flow'

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* Mode tabs + strict/soft */}
      <div className="w-full flex items-center justify-between gap-2">
        <div className="flex rounded-[13px] p-1" style={{ background: 'var(--canvas)' }}>
          {MODES.map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              disabled={running || elapsedSecs > 0}
              className="px-3.5 py-[7px] rounded-[10px] text-xs font-bold transition-all disabled:opacity-50"
              style={
                mode === m.id
                  ? { background: 'var(--surface)', color: 'var(--coral-deep)', boxShadow: 'var(--shadow-sm)' }
                  : { color: 'var(--ink-3)' }
              }
            >
              {m.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setStrict(!strict)}
          disabled={running}
          className="flex items-center gap-1.5 text-xs font-semibold disabled:opacity-50"
          style={{ color: strict ? 'var(--coral-deep)' : 'var(--ink-3)' }}
          title={strict ? 'Strict: hard stop at time' : 'Soft: chime and keep going'}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 16 }}>
            {strict ? 'bolt' : 'coffee'}
          </span>
          <span className="hidden sm:inline">{strict ? 'Strict stop' : 'Soft suggestion'}</span>
        </button>
      </div>

      {/* Task selector */}
      {user && <TaskSelector user={user} disabled={!idle} />}

      {/* Timer visual */}
      <TimerFace
        style={tStyle}
        display={display}
        progress={progress}
        running={running}
        overtime={overtime}
        stateLabel={stateLabel}
        theme="light"
        size={230}
      />

      {/* Style switcher */}
      <TimerStylePicker value={tStyle} onChange={pickStyle} theme="light" />

      {/* Overtime hint */}
      {overtime && (
        <div className="text-xs px-3 py-1.5 rounded-xl" style={{ background: 'rgba(255,126,77,0.12)', color: 'var(--coral-deep)' }}>
          Planned time's up — keep going or stop when ready.
        </div>
      )}

      {/* Minutes input (countdown modes, idle) */}
      {mode !== 'flow' && idle && (
        <label className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm" style={{ background: 'var(--canvas)', color: 'var(--ink-2)' }}>
          <span className="material-symbols-rounded" style={{ fontSize: 17, color: 'var(--ink-3)' }}>alarm</span>
          <input
            type="number" min={1} max={240}
            value={plannedMins}
            onChange={e => setDuration(Math.max(1, Math.min(240, Number(e.target.value) || 1)))}
            className="w-12 bg-transparent text-right outline-none font-bold"
            style={{ color: 'var(--ink)' }}
          />
          min
        </label>
      )}

      {/* Controls */}
      <div className="flex items-center gap-3">
        {idle ? (
          <button
            onClick={() => start(onComplete)}
            className="flex items-center gap-2 px-11 py-[15px] rounded-[18px] font-extrabold text-[15px] text-white transition-all active:scale-95"
            style={{ background: 'linear-gradient(150deg, var(--coral), var(--coral-deep))', boxShadow: 'var(--shadow-coral)' }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 21 }}>play_arrow</span>
            Start
          </button>
        ) : (
          <>
            <button
              onClick={() => (running ? pause() : start(onComplete))}
              className="flex items-center gap-2 px-7 py-[15px] rounded-[18px] font-extrabold text-[15px] transition-all active:scale-95"
              style={{ background: 'var(--canvas)', color: 'var(--ink-2)' }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 20 }}>{running ? 'pause' : 'play_arrow'}</span>
              {running ? 'Pause' : 'Resume'}
            </button>
            <button
              onClick={() => stop(onComplete)}
              className="flex items-center gap-2 px-7 py-[15px] rounded-[18px] font-extrabold text-[15px] text-white transition-all active:scale-95"
              style={{ background: 'linear-gradient(150deg, var(--coral), var(--coral-deep))', boxShadow: 'var(--shadow-coral)' }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 20 }}>stop</span>
              Stop
            </button>
          </>
        )}

        {idle && (
          <button
            onClick={reset}
            className="w-11 h-11 rounded-[14px] flex items-center justify-center transition-all"
            style={{ background: 'var(--canvas)', color: 'var(--ink-3)' }}
            title="Reset"
          >
            <span className="material-symbols-rounded" style={{ fontSize: 19 }}>restart_alt</span>
          </button>
        )}
      </div>

      {/* Extend (countdown, running) */}
      {running && mode !== 'flow' && (
        <div className="flex gap-2">
          {[5, 10, 15].map(m => (
            <button
              key={m}
              onClick={() => extend(m)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
              style={{ background: 'rgba(255,126,77,0.12)', color: 'var(--coral-deep)' }}
            >
              +{m}m
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
