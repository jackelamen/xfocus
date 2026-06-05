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

  const R = 26
  const C = 2 * Math.PI * R

  return (
    <div
      className="rounded-3xl px-5 py-4 flex items-center gap-4"
      style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.08), rgba(255,255,255,0.03))', border: '1px solid rgba(249,115,22,0.15)' }}
    >
      {/* Daily goal ring */}
      <div className="relative flex-shrink-0" style={{ width: 64, height: 64 }}>
        <svg width="64" height="64" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
          <circle
            cx="32" cy="32" r={R} fill="none"
            stroke={goalMet ? '#34d399' : '#f97316'} strokeWidth="5" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - goalPct)}
            style={{ transition: 'stroke-dashoffset 0.8s ease', transform: 'rotate(-90deg)', transformOrigin: 'center' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {goalMet ? (
            <span className="material-symbols-rounded text-emerald-400" style={{ fontSize: 22 }}>check</span>
          ) : (
            <>
              <span className="text-sm font-black text-white leading-none">{Math.round(goalPct * 100)}%</span>
              <span className="text-[8px] text-white/30 uppercase tracking-wider mt-0.5">goal</span>
            </>
          )}
        </div>
      </div>

      {/* Level + XP */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="material-symbols-rounded text-orange-400" style={{ fontSize: 16 }}>workspace_premium</span>
            <span className="text-sm font-black text-white truncate" style={{ fontFamily: 'Manrope, sans-serif' }}>
              {lvl.title}
            </span>
          </div>
          <span className="text-[10px] font-black px-2 py-0.5 rounded-md flex-shrink-0" style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316' }}>
            LVL {lvl.level}
          </span>
        </div>

        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.round(lvl.progress * 100)}%`, background: 'linear-gradient(90deg, #f97316, #fbbf24)', transition: 'width 0.8s ease' }}
          />
        </div>

        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[10px] text-white/30">
            {goalMet ? `${formatMinutes(todayMins)} today · goal met` : `${formatMinutes(todayMins)} / ${formatMinutes(DAILY_GOAL_MINS)} today`}
          </span>
          {!lvl.isMax && (
            <span className="text-[10px] text-white/30">{lvl.xpToNext} XP to next</span>
          )}
        </div>
      </div>
    </div>
  )
}
