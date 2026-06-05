import React from 'react'
import { useTimerStore } from '../../store/timerStore.js'
import { formatTime } from '../../lib/utils.js'

const CIRCUM = 276.46  // 2 * π * 44

const DURATIONS = [25, 50, 90]

export default function FocusTimer({ onComplete }) {
  const { secsLeft, secsTotal, running, durationMins, start, pause, reset, extend, setDuration } = useTimerStore()

  const progress = secsTotal > 0 ? secsLeft / secsTotal : 1
  const dashOffset = CIRCUM * (1 - progress)

  const strokeColor = secsLeft <= 5 * 60 && running ? '#ef4444' : '#f97316'

  function handleToggle() {
    if (running) {
      pause()
    } else {
      start(onComplete)
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Duration picker */}
      {!running && (
        <div
          className="flex rounded-xl p-1 gap-1"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          {DURATIONS.map(d => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={
                durationMins === d
                  ? { background: '#f97316', color: '#fff' }
                  : { color: 'rgba(255,255,255,0.4)' }
              }
            >
              {d}m
            </button>
          ))}
        </div>
      )}

      {/* SVG Ring */}
      <div className="relative" style={{ width: 200, height: 200 }}>
        <svg width="200" height="200" viewBox="0 0 100 100">
          {/* Track */}
          <circle
            cx="50" cy="50" r="44"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="7"
          />
          {/* Progress */}
          <circle
            cx="50" cy="50" r="44"
            fill="none"
            stroke={strokeColor}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={CIRCUM}
            strokeDashoffset={dashOffset}
            className="timer-ring"
          />
        </svg>

        {/* Center display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-4xl font-black tabular-nums text-white"
            style={{ fontFamily: 'Manrope, sans-serif', letterSpacing: '-0.02em' }}
          >
            {formatTime(secsLeft)}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {running ? 'in flow' : 'ready'}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleToggle}
          className="flex items-center gap-2 px-7 py-3 rounded-2xl font-bold text-sm text-white transition-all active:scale-95"
          style={{ background: running ? 'rgba(255,255,255,0.08)' : '#f97316' }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 20 }}>
            {running ? 'pause' : 'play_arrow'}
          </span>
          {running ? 'Pause' : 'Start'}
        </button>

        <button
          onClick={reset}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-white/10"
          style={{ color: 'rgba(255,255,255,0.3)' }}
          title="Reset"
        >
          <span className="material-symbols-rounded" style={{ fontSize: 18 }}>restart_alt</span>
        </button>
      </div>

      {/* Extend buttons (only while running) */}
      {running && (
        <div className="flex gap-2">
          {[5, 10, 15].map(m => (
            <button
              key={m}
              onClick={() => extend(m)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
              style={{ background: 'rgba(249,115,22,0.1)', color: '#f97316', border: '1px solid rgba(249,115,22,0.2)' }}
            >
              +{m}m
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
