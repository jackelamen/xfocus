import React, { useEffect, useRef, useState } from 'react'
import { useTimerStore } from '../../store/timerStore.js'
import { useFocusStore } from '../../store/focusStore.js'
import { formatTime, startAmbient } from '../../lib/utils.js'

const SOUNDS = [
  { id: 'off',   icon: 'volume_off',   label: 'Silent' },
  { id: 'brown', icon: 'graphic_eq',   label: 'Brown noise' },
  { id: 'rain',  icon: 'rainy',        label: 'Rain' },
  { id: 'hum',   icon: 'blur_on',      label: 'Deep hum' },
]

export default function ImmersiveMode({ onExit, onComplete }) {
  const { mode, plannedMins, elapsedSecs, running, overtime, start, pause, stop, extend, activeBlockTitle } = useTimerStore()
  const streak = useFocusStore(s => s.streak)
  const intention = useFocusStore(s => s.intention)

  const [sound, setSound] = useState('off')
  const ambientRef = useRef(null)

  const plannedSecs = mode === 'flow' ? 0 : plannedMins * 60
  const remaining = Math.max(0, plannedSecs - elapsedSecs)
  const overtimeSecs = Math.max(0, elapsedSecs - plannedSecs)
  const progress = mode === 'flow' ? 0 : plannedSecs > 0 ? Math.min(1, elapsedSecs / plannedSecs) : 0
  const idle = !running && elapsedSecs === 0
  const display = mode === 'flow'
    ? formatTime(elapsedSecs)
    : overtime ? `+${formatTime(overtimeSecs)}` : formatTime(remaining)

  // Manage ambient audio lifecycle
  useEffect(() => {
    if (ambientRef.current) { ambientRef.current.stop(); ambientRef.current = null }
    if (sound !== 'off') ambientRef.current = startAmbient(sound, 0.22)
    return () => {
      if (ambientRef.current) { ambientRef.current.stop(); ambientRef.current = null }
    }
  }, [sound])

  // Esc to exit
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onExit() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onExit])

  const breathe = running ? 'xf-breathe 6s ease-in-out infinite' : 'none'
  const breatheSlow = running ? 'xf-breathe-slow 6s ease-in-out infinite' : 'none'

  return (
    <div
      className="xf-immersive fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: 'radial-gradient(circle at 50% 40%, #14141f 0%, #08080f 70%)' }}
    >
      {/* Exit */}
      <button
        onClick={onExit}
        className="absolute top-6 right-6 flex items-center gap-1.5 px-3 py-2 rounded-xl text-white/40 hover:text-white/80 transition-colors"
        style={{ background: 'rgba(255,255,255,0.04)' }}
      >
        <span className="material-symbols-rounded" style={{ fontSize: 18 }}>close_fullscreen</span>
        <span className="text-xs font-bold">Exit</span>
      </button>

      {/* Streak + intention top */}
      <div className="absolute top-6 left-6 flex flex-col gap-2">
        {streak > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
            <span className="material-symbols-rounded text-orange-400" style={{ fontSize: 15 }}>local_fire_department</span>
            <span className="text-xs font-black text-orange-300">{streak}-day chain</span>
          </div>
        )}
        {intention?.text && (
          <p className="text-xs text-white/35 max-w-[200px] leading-snug">"{intention.text}"</p>
        )}
      </div>

      {/* Breathing focus visual */}
      <div className="relative flex items-center justify-center" style={{ width: 340, height: 340 }}>
        {/* Outer glow rings */}
        <div
          className="absolute rounded-full"
          style={{ width: 320, height: 320, background: 'radial-gradient(circle, rgba(249,115,22,0.12), transparent 70%)', animation: breatheSlow }}
        />
        <div
          className="absolute rounded-full"
          style={{ width: 240, height: 240, background: 'radial-gradient(circle, rgba(249,115,22,0.18), transparent 70%)', animation: breathe }}
        />

        {/* Progress ring */}
        <svg width="300" height="300" viewBox="0 0 100 100" className="absolute">
          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" />
          <circle
            cx="50" cy="50" r="45" fill="none"
            stroke="url(#xf-grad)" strokeWidth="2.5" strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 45}
            strokeDashoffset={2 * Math.PI * 45 * (1 - progress)}
            style={{ transition: 'stroke-dashoffset 1s linear', transform: 'rotate(-90deg)', transformOrigin: 'center' }}
          />
          <defs>
            <linearGradient id="xf-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
          </defs>
        </svg>

        {/* Time */}
        <div className="relative flex flex-col items-center">
          <span
            className="text-6xl font-black tabular-nums text-white"
            style={{ fontFamily: 'Manrope, sans-serif', letterSpacing: '-0.03em', color: overtime ? '#ffb894' : '#fff' }}
          >
            {display}
          </span>
          <span className="text-[11px] font-bold uppercase tracking-[0.3em] mt-1 text-white/30">
            {overtime ? 'still going' : running ? 'breathe · focus' : idle ? 'ready' : 'paused'}
          </span>
          {activeBlockTitle && (
            <span className="text-xs text-orange-300/70 mt-2 max-w-[220px] text-center truncate">{activeBlockTitle}</span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="mt-8 flex items-center gap-3">
        <button
          onClick={() => (running ? pause() : start(onComplete))}
          className="flex items-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-sm text-white transition-all active:scale-95"
          style={{ background: running ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #ff7e4d, #ed5f2c)' }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 20 }}>{running ? 'pause' : 'play_arrow'}</span>
          {running ? 'Pause' : idle ? 'Begin' : 'Resume'}
        </button>
        {!idle && (
          <button
            onClick={() => stop(onComplete)}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm text-white transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #ff7e4d, #ed5f2c)' }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 20 }}>stop</span>
            Stop
          </button>
        )}
        {running && mode !== 'flow' && (
          <button
            onClick={() => extend(10)}
            className="px-4 py-3.5 rounded-2xl text-xs font-bold transition-all"
            style={{ background: 'rgba(255,126,77,0.12)', color: '#ffb894', border: '1px solid rgba(255,126,77,0.25)' }}
          >
            +10m
          </button>
        )}
      </div>

      {/* Soundscape picker */}
      <div className="absolute bottom-8 flex items-center gap-2 px-2 py-2 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
        {SOUNDS.map(s => (
          <button
            key={s.id}
            onClick={() => setSound(s.id)}
            title={s.label}
            className="flex items-center justify-center w-10 h-10 rounded-xl transition-all"
            style={
              sound === s.id
                ? { background: 'rgba(249,115,22,0.2)', color: '#f97316' }
                : { color: 'rgba(255,255,255,0.3)' }
            }
          >
            <span className="material-symbols-rounded" style={{ fontSize: 19 }}>{s.icon}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
