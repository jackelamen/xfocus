import React, { useEffect, useRef, useState } from 'react'
import { useTimerStore } from '../../store/timerStore.js'
import { useFocusStore } from '../../store/focusStore.js'
import { formatTime, startAmbient } from '../../lib/utils.js'
import TimerFace, { TIMER_STYLES, STYLE_STORAGE_KEY } from '../timer/TimerFace.jsx'
import TimerStyleGrid from '../timer/TimerStyleGrid.jsx'

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

  // Landscape "zen" mode: on a small/touch device held sideways, show only the timer.
  const [zen, setZen] = useState(false)
  const [zenViewport, setZenViewport] = useState({ w: 800, h: 360 })
  const [chromeShown, setChromeShown] = useState(false)
  useEffect(() => {
    const evaluate = () => {
      const w = window.innerWidth, h = window.innerHeight
      const landscape = w > h
      const touch = window.matchMedia('(pointer: coarse)').matches
      const small = Math.min(w, h) <= 600   // phone-class short edge
      const on = landscape && touch && small
      setZen(on)
      if (on) {
        setZenViewport({ w, h })
        setChromeShown(false)
      }
    }
    evaluate()
    window.addEventListener('resize', evaluate)
    window.addEventListener('orientationchange', evaluate)
    return () => {
      window.removeEventListener('resize', evaluate)
      window.removeEventListener('orientationchange', evaluate)
    }
  }, [])

  // Settings popover (timer-style switcher lives here, not always-visible)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsRef = useRef(null)
  useEffect(() => {
    if (!settingsOpen) return
    const onDown = (e) => { if (settingsRef.current && !settingsRef.current.contains(e.target)) setSettingsOpen(false) }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [settingsOpen])
  const activeStyleLabel = TIMER_STYLES.find(t => t.id === tStyle)?.label || 'Timer style'

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

  // Request true device fullscreen while Focus mode is open (best-effort).
  useEffect(() => {
    const el = document.documentElement
    const req = el.requestFullscreen || el.webkitRequestFullscreen
    if (req) { try { Promise.resolve(req.call(el)).catch(() => {}) } catch { /* ignore */ } }
    return () => {
      const exit = document.exitFullscreen || document.webkitExitFullscreen
      if (exit && (document.fullscreenElement || document.webkitFullscreenElement)) {
        try { Promise.resolve(exit.call(document)).catch(() => {}) } catch { /* ignore */ }
      }
    }
  }, [])

  // ── Zen landscape: only the timer, tap to reveal minimal controls ──
  if (zen) {
    const { w, h } = zenViewport
    // Flip + Digital read as desk clocks → blow them up to fill the viewport.
    // The face box is square, so cap by height; a `fill` flag enlarges the
    // glyphs inside so the time spans the width. Other faces stay modest.
    const bigFace = tStyle === 'flip' || tStyle === 'digital'
    const zenSize = bigFace
      ? Math.min(h * 0.96, w * 0.62)
      : Math.min(h * 0.82, w * 0.5)
    return (
      <div
        className="xf-immersive fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'radial-gradient(circle at 50% 45%, #14141f 0%, #050509 75%)' }}
        onClick={() => setChromeShown(s => !s)}
      >
        <TimerFace
          style={tStyle}
          display={display}
          progress={progress}
          running={running}
          overtime={overtime}
          stateLabel={overtime ? 'still going' : running ? 'focus' : idle ? 'ready' : 'paused'}
          theme="dark"
          size={zenSize}
          fill={bigFace}
        />

        {/* Minimal controls — revealed on tap, hidden otherwise */}
        <div
          className="absolute inset-x-0 bottom-6 flex items-center justify-center gap-3 transition-opacity duration-300"
          style={{ opacity: chromeShown ? 1 : 0, pointerEvents: chromeShown ? 'auto' : 'none' }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => (running ? pause() : start(onComplete))}
            className="flex items-center gap-2 px-7 py-3 rounded-2xl font-bold text-sm text-white active:scale-95"
            style={{ background: running ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #ff7e4d, #ed5f2c)' }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 20 }}>{running ? 'pause' : 'play_arrow'}</span>
            {running ? 'Pause' : idle ? 'Begin' : 'Resume'}
          </button>
          {!idle && (
            <button
              onClick={() => stop(onComplete)}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-white active:scale-95"
              style={{ background: 'linear-gradient(135deg, #ff7e4d, #ed5f2c)' }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 20 }}>stop</span>
              Stop
            </button>
          )}
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 px-4 py-3 rounded-2xl text-white/50 active:scale-95"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>close_fullscreen</span>
            <span className="text-xs font-bold">Exit</span>
          </button>
        </div>

        {/* First-time hint */}
        {!chromeShown && (
          <p className="absolute bottom-4 inset-x-0 text-center text-[11px] text-white/20">tap for controls</p>
        )}
      </div>
    )
  }

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

      {/* Timer visual (selectable style) */}
      <div className="flex flex-col items-center">
        <TimerFace
          style={tStyle}
          display={display}
          progress={progress}
          running={running}
          overtime={overtime}
          stateLabel={overtime ? 'still going' : running ? 'focus' : idle ? 'ready' : 'paused'}
          theme="dark"
          size={320}
        />
        {activeBlockTitle && (
          <span className="text-xs text-orange-300/70 mt-2 max-w-[220px] text-center truncate">{activeBlockTitle}</span>
        )}
      </div>

      {/* Timer style — behind a compact button; panel shows a wrapped grid */}
      <div className="mt-5 relative" ref={settingsRef}>
        <button
          onClick={() => setSettingsOpen(o => !o)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
          style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.55)' }}
          aria-expanded={settingsOpen}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 16 }}>tune</span>
          <span>{activeStyleLabel}</span>
          <span className="material-symbols-rounded" style={{ fontSize: 16 }}>{settingsOpen ? 'expand_less' : 'expand_more'}</span>
        </button>

        {settingsOpen && (
          <div
            className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 p-3 rounded-2xl"
            style={{ width: 'min(340px, 86vw)', background: '#1b1b27', boxShadow: '0 16px 40px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <p className="text-[11px] font-extrabold uppercase tracking-wider mb-2 px-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Timer style</p>
            <TimerStyleGrid value={tStyle} onChange={(id) => { pickStyle(id); setSettingsOpen(false) }} theme="dark" />
          </div>
        )}
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
