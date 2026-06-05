import React from 'react'
import { useFocusStore } from '../../store/focusStore.js'
import { levelFromXp, DAILY_GOAL_MINS } from '../../lib/progression.js'
import { formatMinutes } from '../../lib/utils.js'

export default function MomentumCard() {
  const xp = useFocusStore(s => s.xp)
  const sessions = useFocusStore(s => s.sessions)

  const lvl = levelFromXp(xp)
  const todayMins = sessions.reduce((sum, s) => sum + (s.duration_mins || 0), 0)
  const goalPct = Math.min(1, todayMins / DAILY_GOAL_MINS)
  const goalMet = todayMins >= DAILY_GOAL_MINS

  const R = 22
  const C = 2 * Math.PI * R

  return (
    <div
      className="rounded-[22px] px-[18px] py-4 flex items-center gap-4"
      style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-sm)' }}
    >
      {/* Daily goal ring */}
      <div className="relative flex-shrink-0" style={{ width: 52, height: 52 }}>
        <svg width="52" height="52" viewBox="0 0 52 52">
          <circle cx="26" cy="26" r={R} fill="none" stroke="var(--canvas)" strokeWidth="4.5" />
          <circle
            cx="26" cy="26" r={R} fill="none"
            stroke={goalMet ? 'var(--sky-deep)' : 'var(--coral)'} strokeWidth="4.5" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - goalPct)}
            style={{ transition: 'stroke-dashoffset 0.8s ease', transform: 'rotate(-90deg)', transformOrigin: 'center' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {goalMet ? (
            <span className="material-symbols-rounded" style={{ fontSize: 22, color: 'var(--sky-deep)' }}>check</span>
          ) : (
            <span className="text-xs font-extrabold" style={{ color: 'var(--ink)' }}>{Math.round(goalPct * 100)}%</span>
          )}
        </div>
      </div>

      {/* Level + XP */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-[7px]">
          <span className="text-sm font-extrabold truncate" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--ink)' }}>
            {lvl.title}
          </span>
          <span className="text-[11px] font-extrabold flex-shrink-0" style={{ color: 'var(--coral-deep)' }}>
            LVL {lvl.level}
          </span>
        </div>

        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--canvas)' }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.round(lvl.progress * 100)}%`, background: 'linear-gradient(90deg, var(--lav-deep), var(--sky-deep))', transition: 'width 0.8s ease' }}
          />
        </div>

        <p className="text-[11px] mt-[7px]" style={{ color: 'var(--ink-3)' }}>
          {goalMet
            ? `${formatMinutes(todayMins)} today · goal met`
            : `${formatMinutes(todayMins)} of ${formatMinutes(DAILY_GOAL_MINS)} today`}
          {!lvl.isMax && ` · ${lvl.xpToNext} XP to ${lvl.nextTitle}`}
        </p>
      </div>
    </div>
  )
}
