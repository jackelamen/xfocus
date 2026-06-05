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

  function handleModalClose(r) {
    setSessionMeta(null)
    if (r && r.gainedXp > 0) setReward(r)
  }

  const dateLabel = new Date()
    .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    .replace(',', ' ·')

  // ── Shared building blocks (rendered into both mobile + desktop layouts) ──

  const header = (
    <div className="flex items-center justify-between">
      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>
        {dateLabel}
      </p>
      <div className="flex gap-2.5">
        {streak > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-sm)', color: 'var(--coral-deep)' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 15 }}>local_fire_department</span>
            <span className="text-xs font-extrabold">{streak}</span>
          </div>
        )}
        {todayMins > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-sm)', color: 'var(--ink-2)' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 15 }}>schedule</span>
            <span className="text-xs font-bold">{formatMinutes(todayMins)}</span>
          </div>
        )}
      </div>
    </div>
  )

  const activeBlockLabel = activeBlockTitle && (
    <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl" style={{ background: 'linear-gradient(120deg, rgba(255,201,168,0.30), rgba(255,155,115,0.18))' }}>
      <span className="material-symbols-rounded" style={{ fontSize: 17, color: 'var(--coral-deep)' }}>calendar_view_day</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold truncate" style={{ color: 'var(--ink)' }}>{activeBlockTitle}</p>
        {activeTaskNames.length > 0 && (
          <p className="text-[10px] truncate" style={{ color: 'var(--ink-3)' }}>{activeTaskNames.join(', ')}</p>
        )}
      </div>
      <button onClick={() => useTimerStore.getState().setActiveBlock(null)} style={{ color: 'var(--ink-3)' }}>
        <span className="material-symbols-rounded" style={{ fontSize: 16 }}>close</span>
      </button>
    </div>
  )

  const timerCard = (
    <div className="rounded-[30px] pt-8 pb-7 px-6 flex flex-col items-center" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow)' }}>
      <FocusTimer onComplete={handleTimerComplete} user={user} />
      <button
        onClick={() => setImmersive(true)}
        className="mt-4 flex items-center gap-1.5 text-xs font-semibold transition-colors"
        style={{ color: 'var(--ink-3)' }}
      >
        <span className="material-symbols-rounded" style={{ fontSize: 15 }}>open_in_full</span>
        Enter focus mode
      </button>
    </div>
  )

  const sessionsCard = sessions.length > 0 && (
    <div className="rounded-3xl overflow-hidden" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="px-5 pt-4 pb-2 flex items-center gap-2">
        <span className="material-symbols-rounded" style={{ fontSize: 15, color: 'var(--ink-3)' }}>history</span>
        <span className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>Today's sessions</span>
      </div>
      <div>
        {sessions.map((s, i) => (
          <div key={s.id} className="px-5 py-3 flex items-center gap-3" style={i > 0 ? { borderTop: '1px solid var(--line)' } : undefined}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(150deg, var(--peach), var(--coral))' }}>
              <span className="material-symbols-rounded text-white" style={{ fontSize: 15 }}>timer</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate" style={{ color: 'var(--ink)' }}>
                {s.task_names?.join(', ') || s.focus_type || 'Deep work'}
              </p>
              <p className="text-[10px]" style={{ color: 'var(--ink-3)' }}>{s.duration_mins}m · {s.felt_score ? '★'.repeat(s.felt_score) : ''}</p>
            </div>
            {s.completed && (
              <span className="material-symbols-rounded" style={{ fontSize: 17, color: 'var(--sky-deep)' }}>check_circle</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )

  const quote = (
    <div className="pt-5 text-center" style={{ borderTop: '1px solid var(--line)' }}>
      <p className="text-[13px] italic leading-relaxed" style={{ color: 'var(--ink-2)' }}>"{q.text}"</p>
      <p className="text-[10px] mt-2 font-bold uppercase tracking-wider" style={{ color: 'var(--ink-4)' }}>xFocus · daily</p>
    </div>
  )

  return (
    <div className="h-screen overflow-y-auto flex flex-col">
      <div className="flex-1 w-full max-w-lg lg:max-w-5xl mx-auto px-6 sm:px-8 py-8 lg:py-10 flex flex-col">

        {/* Header — full width on both */}
        <div className="mb-8">{header}</div>

        {/* ── Mobile: single calm column ── */}
        <div className="flex flex-col lg:hidden">
          <div className="mb-8"><IntentionBar user={user} /></div>
          <ActiveBlockCard wrapClass="mb-6" />
          {activeBlockLabel && <div className="mb-6">{activeBlockLabel}</div>}
          <div className="mb-7">{timerCard}</div>
          <MomentumCard />
          <div className="mt-5"><DistractionLog user={user} /></div>
          {sessionsCard && <div className="mt-5">{sessionsCard}</div>}
          <div className="mt-9">{quote}</div>
        </div>

        {/* ── Desktop: two-column dashboard ── */}
        <div className="hidden lg:grid gap-8 items-start" style={{ gridTemplateColumns: '1fr 1.05fr' }}>
          {/* Left: timer hero (centered in its column) */}
          <div className="flex flex-col gap-6 lg:sticky lg:top-0">
            {timerCard}
            {sessionsCard}
          </div>

          {/* Right: intention + plan + momentum + distractions */}
          <div className="flex flex-col gap-6">
            <IntentionBar user={user} />
            <ActiveBlockCard />
            {activeBlockLabel}
            <MomentumCard />
            <DistractionLog user={user} />
            {quote}
          </div>
        </div>

      </div>

      {immersive && (
        <ImmersiveMode onExit={() => setImmersive(false)} onComplete={handleTimerComplete} />
      )}
      {sessionMeta && (
        <PostSessionModal user={user} sessionMeta={sessionMeta} onClose={handleModalClose} />
      )}
      {reward && (
        <CelebrationOverlay reward={reward} onDone={() => setReward(null)} />
      )}
    </div>
  )
}
