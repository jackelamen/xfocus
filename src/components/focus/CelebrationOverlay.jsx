import React, { useEffect, useMemo, useState } from 'react'
import { levelFromXp, detectLevelUp } from '../../lib/progression.js'
import { playChime } from '../../lib/utils.js'

const COLORS = ['#f97316', '#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#a78bfa']

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        dur: 1.6 + Math.random() * 1.4,
        color: COLORS[i % COLORS.length],
        size: 6 + Math.random() * 8,
        rot: Math.random() * 360,
        drift: (Math.random() - 0.5) * 120,
      })),
    []
  )
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map(p => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            top: '-20px',
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.6,
            background: p.color,
            borderRadius: 2,
            opacity: 0.9,
            transform: `rotate(${p.rot}deg)`,
            animation: `xf-confetti ${p.dur}s ${p.delay}s ease-in forwards`,
            ['--xf-drift']: `${p.drift}px`,
          }}
        />
      ))}
    </div>
  )
}

export default function CelebrationOverlay({ reward, onDone }) {
  const { gainedXp, prevXp, newXp, newStreak, streakUp } = reward
  const levelUp = useMemo(() => detectLevelUp(prevXp, newXp), [prevXp, newXp])
  const lvl = useMemo(() => levelFromXp(newXp), [newXp])

  const [shownXp, setShownXp] = useState(0)

  useEffect(() => {
    playChime('celebrate')
    if (levelUp) setTimeout(() => playChime('levelup'), 700)
    // Count up the XP number
    const steps = 30
    let i = 0
    const id = setInterval(() => {
      i++
      setShownXp(Math.round((gainedXp * i) / steps))
      if (i >= steps) clearInterval(id)
    }, 28)
    const t = setTimeout(onDone, levelUp ? 4200 : 3000)
    return () => { clearInterval(id); clearTimeout(t) }
  }, [])

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-6"
      style={{ background: 'rgba(8,8,16,0.82)', backdropFilter: 'blur(6px)' }}
      onClick={onDone}
    >
      <Confetti />
      <div
        className="relative w-full max-w-sm rounded-3xl px-7 py-8 text-center"
        style={{
          background: 'linear-gradient(160deg, #1c1c2e, #14141f)',
          border: '1px solid rgba(249,115,22,0.25)',
          boxShadow: '0 20px 60px rgba(249,115,22,0.18)',
          animation: 'xf-pop 0.45s cubic-bezier(0.2,1.2,0.4,1) both',
        }}
      >
        <div
          className="mx-auto mb-4 w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', boxShadow: '0 8px 24px rgba(249,115,22,0.4)' }}
        >
          <span className="material-symbols-rounded text-white" style={{ fontSize: 34 }}>
            {levelUp ? 'workspace_premium' : 'bolt'}
          </span>
        </div>

        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-400/80">
          {levelUp ? 'Level Up' : 'Session Complete'}
        </p>

        <div className="my-2 flex items-baseline justify-center gap-1.5">
          <span className="text-5xl font-black tabular-nums text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
            +{shownXp}
          </span>
          <span className="text-sm font-black text-orange-400">XP</span>
        </div>

        {levelUp ? (
          <p className="text-sm text-white/80">
            You reached <span className="font-black text-orange-400">Level {lvl.level}</span>
            <br />
            <span className="text-base font-black text-white">{lvl.title}</span>
          </p>
        ) : (
          <p className="text-xs text-white/40">
            Level {lvl.level} · {lvl.title}
          </p>
        )}

        {/* Level progress bar */}
        <div className="mt-4">
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.round(lvl.progress * 100)}%`,
                background: 'linear-gradient(90deg, #f97316, #fbbf24)',
                transition: 'width 0.9s ease 0.3s',
              }}
            />
          </div>
          {!lvl.isMax && (
            <p className="text-[10px] text-white/30 mt-1.5">
              {lvl.xpToNext} XP to {lvl.nextTitle}
            </p>
          )}
        </div>

        {streakUp && (
          <div
            className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)' }}
          >
            <span className="material-symbols-rounded text-orange-400" style={{ fontSize: 16 }}>local_fire_department</span>
            <span className="text-xs font-black text-orange-300">{newStreak}-day streak!</span>
          </div>
        )}

        <p className="mt-5 text-[10px] text-white/20">tap anywhere to continue</p>
      </div>
    </div>
  )
}
