import React, { useState } from 'react'
import FocusTimer from '../components/timer/FocusTimer.jsx'
import PostSessionModal from '../components/timer/PostSessionModal.jsx'
import IntentionBar from '../components/focus/IntentionBar.jsx'
import ActiveBlockCard from '../components/focus/ActiveBlockCard.jsx'
import MomentumCard from '../components/focus/MomentumCard.jsx'
import CelebrationOverlay from '../components/focus/CelebrationOverlay.jsx'
import ImmersiveMode from '../components/focus/ImmersiveMode.jsx'
import DistractionLog from '../components/secondary/DistractionLog.jsx'
import { useFocusStore } from '../store/focusStore.js'
import { useTimerStore } from '../store/timerStore.js'
import { formatMinutes } from '../lib/utils.js'

const DAILY_QUOTES = [
  { text: "Your attention is your most sacred resource. Direct it with intention, or others will spend it for you.", author: "The Luminous Guide" },
  { text: "The successful warrior is the average man, with laser-like focus.", author: "Bruce Lee" },
  { text: "Depth of focus is the art of knowing what to ignore.", author: "James Clear" },
  { text: "The main thing is to keep the main thing the main thing.", author: "Stephen R. Covey" },
  { text: "Starve your distractions, feed your focus.", author: "Unknown" },
  { text: "To ignite your life you must focus on one thing long enough for it to catch fire.", author: "Gary Keller" },
]

function getDailyQuote() {
  const d = new Date()
  const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
  return DAILY_QUOTES[seed % DAILY_QUOTES.length]
}

export default function FocusPage({ user }) {
  const [sessionMeta, setSessionMeta] = useState(null)
  const [reward, setReward] = useState(null)
  const [immersive, setImmersive] = useState(false)
  const sessions = useFocusStore(s => s.sessions)
  const streak = useFocusStore(s => s.streak)
  const { activeBlockTitle, activeTaskNames } = useTimerStore()

  const todayMins = sessions.reduce((sum, s) => sum + (s.duration_mins || 0), 0)
  const q = getDailyQuote()

  function handleTimerComplete(meta) {
    setImmersive(false)
    setSessionMeta(meta)
  }

  // Closing the post-session modal; if a reward was returned, celebrate.
  function handleModalClose(r) {
    setSessionMeta(null)
    if (r && r.gainedXp > 0) setReward(r)
  }

  return (
    <div className="h-screen overflow-y-auto flex flex-col" style={{ background: '#0f0f1a' }}>
      <div className="flex-1 max-w-lg mx-auto w-full px-5 py-6 flex flex-col gap-5">

        {/* Header row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>Focus</h1>
            <p className="text-xs text-white/30 mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-2">
            {streak > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
                <span className="material-symbols-rounded text-orange-400" style={{ fontSize: 14 }}>local_fire_department</span>
                <span className="text-xs font-black text-orange-400">{streak}d</span>
              </div>
            )}
            {todayMins > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <span className="material-symbols-rounded text-white/40" style={{ fontSize: 14 }}>schedule</span>
                <span className="text-xs font-bold text-white/60">{formatMinutes(todayMins)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Momentum: level, XP, daily goal ring */}
        <MomentumCard />

        {/* Intention */}
        <IntentionBar user={user} />

        {/* Active block card */}
        <ActiveBlockCard />

        {/* Active block label (if timer has a block loaded) */}
        {activeBlockTitle && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.15)' }}>
            <span className="material-symbols-rounded text-orange-400 text-sm">calendar_view_day</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-orange-300 truncate">{activeBlockTitle}</p>
              {activeTaskNames.length > 0 && (
                <p className="text-[10px] text-white/30 truncate">{activeTaskNames.join(', ')}</p>
              )}
            </div>
            <button
              onClick={() => useTimerStore.getState().setActiveBlock(null)}
              className="text-white/20 hover:text-white/50 transition-colors"
            >
              <span className="material-symbols-rounded" style={{ fontSize: 15 }}>close</span>
            </button>
          </div>
        )}

        {/* Timer — centered, dominant */}
        <div
          className="rounded-3xl py-10 px-6 flex flex-col items-center gap-5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <FocusTimer onComplete={handleTimerComplete} />

          {/* Enter immersive mode */}
          <button
            onClick={() => setImmersive(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:bg-white/5"
            style={{ color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>open_in_full</span>
            Enter Focus Mode
          </button>
        </div>

        {/* Distraction log */}
        <DistractionLog user={user} />

        {/* Today's sessions */}
        {sessions.length > 0 && (
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="px-4 pt-3 pb-2 flex items-center gap-2">
              <span className="material-symbols-rounded text-white/30 text-sm">history</span>
              <span className="text-xs font-black uppercase tracking-widest text-white/30">Today's Sessions</span>
            </div>
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              {sessions.map(s => (
                <div key={s.id} className="px-4 py-2.5 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(249,115,22,0.1)' }}>
                    <span className="material-symbols-rounded text-orange-400" style={{ fontSize: 14 }}>timer</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white/70 truncate">
                      {s.task_names?.join(', ') || s.focus_type || 'Deep work'}
                    </p>
                    <p className="text-[10px] text-white/30">{s.duration_mins}m · {s.felt_score ? '⭐'.repeat(s.felt_score) : ''}</p>
                  </div>
                  {s.completed && (
                    <span className="material-symbols-rounded text-emerald-400" style={{ fontSize: 16 }}>check_circle</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Daily quote */}
        <div className="pb-6 text-center">
          <p className="text-xs italic leading-relaxed" style={{ color: 'rgba(255,255,255,0.18)' }}>"{q.text}"</p>
          <p className="text-[10px] mt-1.5 font-bold" style={{ color: 'rgba(255,255,255,0.1)' }}>— {q.author}</p>
        </div>

      </div>

      {/* Immersive focus mode */}
      {immersive && (
        <ImmersiveMode onExit={() => setImmersive(false)} onComplete={handleTimerComplete} />
      )}

      {/* Post-session modal */}
      {sessionMeta && (
        <PostSessionModal
          user={user}
          sessionMeta={sessionMeta}
          onClose={handleModalClose}
        />
      )}

      {/* Celebration */}
      {reward && (
        <CelebrationOverlay reward={reward} onDone={() => setReward(null)} />
      )}
    </div>
  )
}
