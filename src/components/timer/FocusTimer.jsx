import React, { useState, useEffect, useMemo } from 'react'
import { useTimerStore } from '../../store/timerStore.js'
import { formatTime } from '../../lib/utils.js'
import TaskSelector from './TaskSelector.jsx'

const SIZE = 230
const R = 45
const CIRCUM = 2 * Math.PI * R // 282.74

const MODES = [
  { id: 'pomodoro', label: 'Pomodoro' },
  { id: 'flow', label: 'Flow' },
  { id: 'custom', label: 'Custom' },
]

const VISUALS = [
  { id: 'breathe', label: 'Breathing', icon: 'spa' },
  { id: 'orbit', label: 'Orbit', icon: 'blur_on' },
  { id: 'liquid', label: 'Liquid', icon: 'water_drop' },
  { id: 'gradient', label: 'Flow', icon: 'gradient' },
]

const VISUAL_KEY = 'xf-timer-visual'

export default function FocusTimer({ onComplete, user }) {
  const {
    mode, strict, plannedMins, elapsedSecs, running, overtime,
    start, pause, stop, reset, extend, setMode, setDuration, setStrict,
  } = useTimerStore()

  const [visual, setVisual] = useState('breathe')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(VISUAL_KEY)
      if (saved && VISUALS.some(v => v.id === saved)) setVisual(saved)
    } catch { /* ignore */ }
  }, [])

  const pickVisual = (id) => {
    setVisual(id)
    try { localStorage.setItem(VISUAL_KEY, id) } catch { /* ignore */ }
  }

  const plannedSecs = mode === 'flow' ? 0 : plannedMins * 60
  const remaining = Math.max(0, plannedSecs - elapsedSecs)
  const overtimeSecs = Math.max(0, elapsedSecs - plannedSecs)
  const progress = mode === 'flow' ? 0 : plannedSecs > 0 ? Math.min(1, elapsedSecs / plannedSecs) : 0
  const idle = !running && elapsedSecs === 0
  const lowTime = mode !== 'flow' && remaining <= 5 * 60 && running && !overtime
  const active = running && !idle

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

      {/* Visual */}
      <TimerVisual
        visual={visual}
        mode={mode}
        progress={progress}
        active={active}
        running={running}
        overtime={overtime}
        lowTime={lowTime}
        display={display}
        stateLabel={stateLabel}
      />

      {/* Visual style switcher */}
      <div className="flex rounded-[13px] p-1" style={{ background: 'var(--canvas)' }}>
        {VISUALS.map(v => (
          <button
            key={v.id}
            onClick={() => pickVisual(v.id)}
            className="flex items-center gap-1.5 px-3 py-[6px] rounded-[10px] text-xs font-bold transition-all"
            style={
              visual === v.id
                ? { background: 'var(--surface)', color: 'var(--coral-deep)', boxShadow: 'var(--shadow-sm)' }
                : { color: 'var(--ink-3)' }
            }
            title={v.label}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>{v.icon}</span>
            <span className="hidden sm:inline">{v.label}</span>
          </button>
        ))}
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

/* ---------------------------------------------------------------- */
/* The animated face of the timer. Switches between four styles.    */
/* ---------------------------------------------------------------- */
function TimerVisual({ visual, mode, progress, active, running, overtime, lowTime, display, stateLabel }) {
  const c1 = lowTime ? '#f4a04d' : 'var(--coral)'
  const c2 = lowTime ? '#ef7a4d' : 'var(--peach)'
  const ringOffset = mode === 'flow' ? CIRCUM * 0.25 : CIRCUM * (1 - progress)

  // dot position for orbit progress marker (along the ring)
  const angle = mode === 'flow' ? 0 : progress * 360
  const rad = (angle - 90) * (Math.PI / 180)
  const dotX = 50 + R * Math.cos(rad)
  const dotY = 50 + R * Math.sin(rad)

  return (
    <div className="relative" style={{ width: SIZE, height: SIZE }}>
      {/* soft glow halo behind everything while running */}
      {active && (
        <div
          className="absolute inset-0 rounded-full xf-halo"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${lowTime ? 'rgba(244,160,77,0.45)' : 'rgba(255,126,77,0.35)'} 0%, rgba(255,126,77,0) 68%)`,
            filter: 'blur(6px)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* drifting particles (orbit style) */}
      {visual === 'orbit' && active && <Particles lowTime={lowTime} />}

      <svg
        width={SIZE} height={SIZE} viewBox="0 0 100 100"
        className={visual === 'breathe' && active ? 'xf-ring-breathe' : 'timer-ring'}
        style={visual === 'breathe' && active ? undefined : { transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 1s linear' }}
      >
        <defs>
          <linearGradient id="xf-timer-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={c1} />
            <stop offset="100%" stopColor={c2} />
          </linearGradient>
          <clipPath id="xf-liquid-clip">
            <circle cx="50" cy="50" r="44" />
          </clipPath>
        </defs>

        {/* track */}
        <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(43,47,68,0.06)" strokeWidth="3" />

        {/* LIQUID FILL */}
        {visual === 'liquid' && (
          <LiquidFill progress={mode === 'flow' ? 0.5 : progress} active={active} c1={c1} c2={c2} flow={mode === 'flow'} />
        )}

        {/* progress ring (all styles except pure liquid use a thin ring too) */}
        <g
          className={visual === 'gradient' && active ? 'xf-grad-rot' : undefined}
          style={{ transformOrigin: 'center' }}
        >
          <circle
            cx="50" cy="50" r={R}
            fill="none"
            stroke="url(#xf-timer-grad)"
            strokeWidth={visual === 'liquid' ? 2.5 : 3.5}
            strokeLinecap="round"
            strokeDasharray={CIRCUM}
            strokeDashoffset={ringOffset}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </g>

        {/* ORBIT progress dot + comet trail */}
        {visual === 'orbit' && mode !== 'flow' && active && (
          <circle cx={dotX} cy={dotY} r="3.2" fill="var(--surface)" stroke="url(#xf-timer-grad)" strokeWidth="2" />
        )}
        {visual === 'orbit' && mode === 'flow' && active && (
          <g className="xf-orbit" style={{ transformOrigin: 'center' }}>
            <circle cx="50" cy={50 - R} r="2.8" fill="url(#xf-timer-grad)" />
          </g>
        )}
      </svg>

      {/* center readout */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span
          className="tabular-nums"
          style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 50, letterSpacing: '-0.04em', color: overtime ? 'var(--coral-deep)' : 'var(--ink)' }}
        >
          {display}
        </span>
        <span className="text-[11px] font-bold uppercase mt-0.5" style={{ letterSpacing: '0.28em', color: 'var(--ink-3)' }}>
          {stateLabel}
        </span>
      </div>
    </div>
  )
}

/* Liquid surface that rises with progress, with two offset waves. */
function LiquidFill({ progress, active, c1, c2, flow }) {
  // surface y in the 0..100 viewbox; 94 = empty, 6 = full
  const level = 94 - progress * 88
  // a wave path drawn twice as wide so it can slide via translateX(-50%)
  const wavePath = useMemo(() => {
    const amp = 2.2
    const baseW = 100
    let d = `M 0 ${level} `
    for (let x = 0; x <= baseW * 2; x += 10) {
      const y = level + Math.sin((x / baseW) * Math.PI * 2) * amp
      d += `L ${x} ${y.toFixed(2)} `
    }
    d += `L ${baseW * 2} 100 L 0 100 Z`
    return d
  }, [level])

  return (
    <g clipPath="url(#xf-liquid-clip)">
      <path d={wavePath} fill="url(#xf-timer-grad)" opacity="0.22" className={active ? 'xf-wave-slow' : undefined} />
      <path d={wavePath} fill="url(#xf-timer-grad)" opacity="0.4" className={active ? 'xf-wave' : undefined} />
    </g>
  )
}

/* A handful of soft particles drifting upward behind the ring. */
function Particles({ lowTime }) {
  const dots = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        left: 10 + Math.random() * 80,
        top: 35 + Math.random() * 55,
        size: 3 + Math.random() * 5,
        dur: 4 + Math.random() * 4,
        delay: Math.random() * 5,
        px: `${(Math.random() * 16 - 8).toFixed(0)}px`,
      })),
    []
  )
  const color = lowTime ? 'rgba(244,160,77,0.55)' : 'rgba(255,184,148,0.6)'
  return (
    <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
      {dots.map((d, i) => (
        <span
          key={i}
          className="xf-particle absolute rounded-full"
          style={{
            left: `${d.left}%`,
            top: `${d.top}%`,
            width: d.size,
            height: d.size,
            background: color,
            '--xf-dur': `${d.dur}s`,
            '--xf-delay': `${d.delay}s`,
            '--xf-px': d.px,
          }}
        />
      ))}
    </div>
  )
}
