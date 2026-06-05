import React from 'react'
import { useTimerStore } from '../../store/timerStore.js'
import { formatTime } from '../../lib/utils.js'
import TaskSelector from './TaskSelector.jsx'

const CIRCUM = 282.74  // 2 * π * 45
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

  const plannedSecs = mode === 'flow' ? 0 : plannedMins * 60
  const remaining = Math.max(0, plannedSecs - elapsedSecs)
  const overtimeSecs = Math.max(0, elapsedSecs - plannedSecs)
  const progress = mode === 'flow' ? 0 : plannedSecs > 0 ? Math.min(1, elapsedSecs / plannedSecs) : 0
  const idle = !running && elapsedSecs === 0
  const lowTime = mode !== 'flow' && remaining <= 5 * 60 && running && !overtime

  // What the big number shows
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

  // Flow has no fixed ring; show a gentle pulsing full ring instead.
  const ringOffset = mode === 'flow' ? CIRCUM * 0.25 : CIRCUM * (1 - progress)

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

      {/* Ring */}
      <div className="relative" style={{ width: 230, height: 230 }}>
        <svg width="230" height="230" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="xf-timer-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={lowTime ? '#f4a04d' : 'var(--coral)'} />
              <stop offset="100%" stopColor={lowTime ? '#ef7a4d' : 'var(--peach)'} />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(43,47,68,0.06)" strokeWidth="3" />
          <circle
            cx="50" cy="50" r="45"
            fill="none"
            stroke="url(#xf-timer-grad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={CIRCUM}
            strokeDashoffset={ringOffset}
            className="timer-ring"
            style={mode === 'flow' && running ? { animation: 'xf-breathe 4s ease-in-out infinite', transformOrigin: 'center' } : undefined}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="tabular-nums" style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 50, letterSpacing: '-0.04em', color: overtime ? 'var(--coral-deep)' : 'var(--ink)' }}>
            {display}
          </span>
          <span className="text-[11px] font-bold uppercase mt-0.5" style={{ letterSpacing: '0.28em', color: 'var(--ink-3)' }}>
            {stateLabel}
          </span>
        </div>
      </div>

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
