import React from 'react'
import { useTimerStore } from '../../store/timerStore.js'
import { formatTime } from '../../lib/utils.js'

const CIRCUM = 282.74  // 2 * π * 45

const DURATIONS = [25, 50, 90]

export default function FocusTimer({ onComplete }) {
  const { secsLeft, secsTotal, running, durationMins, start, pause, reset, extend, setDuration } = useTimerStore()

  const progress = secsTotal > 0 ? secsLeft / secsTotal : 1
  const dashOffset = CIRCUM * (1 - progress)
  const lowTime = secsLeft <= 5 * 60 && running

  function handleToggle() {
    if (running) pause()
    else start(onComplete)
  }

  return (
    <div className="flex flex-col items-center gap-7 w-full">
      {/* Duration picker */}
      {!running && (
        <div className="flex rounded-[13px] p-1" style={{ background: 'var(--canvas)' }}>
          {DURATIONS.map(d => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className="px-[18px] py-[7px] rounded-[10px] text-xs font-bold transition-all"
              style={
                durationMins === d
                  ? { background: 'linear-gradient(150deg, var(--coral), var(--peach))', color: '#fff', boxShadow: '0 4px 10px rgba(255,155,115,0.40)' }
                  : { color: 'var(--ink-3)' }
              }
            >
              {d}m
            </button>
          ))}
        </div>
      )}

      {/* SVG Ring */}
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
            strokeDashoffset={dashOffset}
            className="timer-ring"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="tabular-nums"
            style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 54, letterSpacing: '-0.04em', color: 'var(--ink)' }}
          >
            {formatTime(secsLeft)}
          </span>
          <span className="text-[11px] font-bold uppercase mt-0.5" style={{ letterSpacing: '0.3em', color: 'var(--ink-3)' }}>
            {running ? 'in flow' : 'ready'}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleToggle}
          className="flex items-center gap-2 px-11 py-[15px] rounded-[18px] font-extrabold text-[15px] text-white transition-all active:scale-95"
          style={
            running
              ? { background: 'var(--canvas)', color: 'var(--ink-2)', boxShadow: 'none' }
              : { background: 'linear-gradient(150deg, var(--coral), var(--coral-deep))', boxShadow: 'var(--shadow-coral)' }
          }
        >
          <span className="material-symbols-rounded" style={{ fontSize: 21 }}>
            {running ? 'pause' : 'play_arrow'}
          </span>
          {running ? 'Pause' : 'Start'}
        </button>

        <button
          onClick={reset}
          className="w-11 h-11 rounded-[14px] flex items-center justify-center transition-all"
          style={{ background: 'var(--canvas)', color: 'var(--ink-3)' }}
          title="Reset"
        >
          <span className="material-symbols-rounded" style={{ fontSize: 19 }}>restart_alt</span>
        </button>
      </div>

      {/* Extend buttons */}
      {running && (
        <div className="flex gap-2">
          {[5, 10, 15].map(m => (
            <button
              key={m}
              onClick={() => extend(m)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
              style={{ background: 'rgba(255,155,115,0.12)', color: 'var(--coral-deep)' }}
            >
              +{m}m
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
