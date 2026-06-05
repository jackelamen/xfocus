import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase.js'
import { formatMinutes } from '../lib/utils.js'
import { format, parseISO, startOfWeek, addDays, isWeekend, subDays } from 'date-fns'
import {
  totalXp, levelFromXp, lifetimeStats, bestFocusWindow, flowTrend, longestStreak,
} from '../lib/progression.js'

function StoryStat({ icon, value, label, accent }) {
  return (
    <div
      className="rounded-2xl px-4 py-3.5 flex flex-col gap-1"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <span className="material-symbols-rounded" style={{ fontSize: 18, color: accent || 'rgba(249,115,22,0.9)' }}>{icon}</span>
      <p className="text-lg font-black text-white leading-none mt-1" style={{ fontFamily: 'Manrope, sans-serif' }}>{value}</p>
      <p className="text-[10px] text-white/30 leading-tight">{label}</p>
    </div>
  )
}

const HEATMAP_DAYS = 35  // 5 weeks

function getHeatmapDays() {
  const days = []
  const today = new Date()
  for (let i = HEATMAP_DAYS - 1; i >= 0; i--) {
    const d = subDays(today, i)
    days.push(format(d, 'yyyy-MM-dd'))
  }
  return days
}

function FeltEmoji({ score }) {
  const map = { 1: '😔', 2: '😐', 3: '🙂', 4: '😊', 5: '🔥' }
  return <span>{map[score] || '–'}</span>
}

export default function HistoryPage({ user }) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [sessionsByDate, setSessionsByDate] = useState({})

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(200)
      const all = data || []
      setSessions(all)
      // Group by date
      const byDate = {}
      all.forEach(s => {
        if (!byDate[s.date]) byDate[s.date] = []
        byDate[s.date].push(s)
      })
      setSessionsByDate(byDate)
      setLoading(false)
    }
    load()
  }, [user.id])

  // Weekly total
  const today = new Date()
  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const weekSessions = sessions.filter(s => s.date >= weekStart)
  const weekMins = weekSessions.reduce((sum, s) => sum + (s.duration_mins || 0), 0)

  const heatmapDays = getHeatmapDays()

  // Story stats
  const story = useMemo(() => {
    const xp = totalXp(sessions)
    const lvl = levelFromXp(xp)
    const life = lifetimeStats(sessions)
    const best = bestFocusWindow(sessions)
    const trend = flowTrend(sessions)
    const completedDates = [...new Set(sessions.filter(s => s.completed).map(s => s.date))]
    const longest = longestStreak(completedDates)
    return { xp, lvl, life, best, trend, longest }
  }, [sessions])

  // Get intensity for a day (0-4)
  function intensity(date) {
    const daySessions = sessionsByDate[date] || []
    const mins = daySessions.reduce((sum, s) => sum + (s.duration_mins || 0), 0)
    if (mins === 0) return 0
    if (mins < 25) return 1
    if (mins < 60) return 2
    if (mins < 120) return 3
    return 4
  }

  const intensityColors = [
    'rgba(255,255,255,0.05)',
    'rgba(249,115,22,0.2)',
    'rgba(249,115,22,0.4)',
    'rgba(249,115,22,0.65)',
    '#f97316',
  ]

  return (
    <div className="h-screen overflow-y-auto" style={{ background: '#0f0f1a' }}>
      <div className="max-w-2xl mx-auto px-5 py-6 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-xl font-black text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>History</h1>
          <p className="text-xs text-white/30 mt-0.5">Your deep work record</p>
        </div>

        {/* This week stat */}
        <div
          className="rounded-2xl px-6 py-5 flex items-center gap-5"
          style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.15)' }}
        >
          <div>
            <p className="text-3xl font-black text-orange-400" style={{ fontFamily: 'Manrope, sans-serif' }}>{formatMinutes(weekMins)}</p>
            <p className="text-xs text-white/30 mt-0.5">deep work this week</p>
          </div>
          <div className="flex-1" />
          <div className="text-right">
            <p className="text-lg font-black text-white/60">{weekSessions.length}</p>
            <p className="text-xs text-white/30">sessions</p>
          </div>
        </div>

        {/* Level / title banner */}
        <div
          className="rounded-2xl px-5 py-4 flex items-center gap-4"
          style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.1), rgba(255,255,255,0.03))', border: '1px solid rgba(249,115,22,0.18)' }}
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
            <span className="material-symbols-rounded text-white" style={{ fontSize: 24 }}>workspace_premium</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-black text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>{story.lvl.title}</p>
            <p className="text-[11px] text-white/35">Level {story.lvl.level} · {story.xp.toLocaleString()} XP</p>
            <div className="h-1.5 rounded-full overflow-hidden mt-1.5" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full" style={{ width: `${Math.round(story.lvl.progress * 100)}%`, background: 'linear-gradient(90deg, #f97316, #fbbf24)' }} />
            </div>
          </div>
          {!story.lvl.isMax && (
            <div className="text-right flex-shrink-0">
              <p className="text-[10px] text-white/30">next</p>
              <p className="text-xs font-bold text-orange-300 truncate max-w-[90px]">{story.lvl.nextTitle}</p>
            </div>
          )}
        </div>

        {/* Story stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StoryStat icon="hourglass_top" value={`${story.life.yearHours}h`} label={`deep work in ${new Date().getFullYear()}`} />
          <StoryStat icon="bolt" value={story.longest || '0'} label="longest streak (days)" accent="#fbbf24" />
          <StoryStat
            icon="wb_twilight"
            value={story.best ? story.best.label : '—'}
            label="your peak focus window"
            accent="#60a5fa"
          />
          <StoryStat
            icon={story.trend && story.trend.delta >= 0 ? 'trending_up' : 'trending_down'}
            value={story.trend ? story.trend.recent.toFixed(1) : '—'}
            label={story.trend ? `flow quality (${story.trend.delta >= 0 ? '+' : ''}${story.trend.delta} trend)` : 'flow quality'}
            accent={story.trend && story.trend.delta >= 0 ? '#34d399' : '#f87171'}
          />
        </div>

        {/* Heatmap */}
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-xs font-black uppercase tracking-widest text-white/30 mb-4">Activity — last 5 weeks</p>
          <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(7, 1fr)` }}>
            {/* Day labels */}
            {['M','T','W','T','F','S','S'].map((d, i) => (
              <div key={i} className="text-center text-[9px] font-bold text-white/20 mb-1">{d}</div>
            ))}
            {/* Cells — pad start so first day aligns to correct column */}
            {(() => {
              const firstDay = parseISO(heatmapDays[0])
              const dow = firstDay.getDay() // 0=Sun
              const startPad = dow === 0 ? 6 : dow - 1 // Mon=0
              const cells = []
              for (let i = 0; i < startPad; i++) {
                cells.push(<div key={`pad-${i}`} />)
              }
              heatmapDays.forEach(date => {
                const level = intensity(date)
                const mins = (sessionsByDate[date] || []).reduce((s, x) => s + (x.duration_mins || 0), 0)
                cells.push(
                  <div
                    key={date}
                    className="aspect-square rounded"
                    style={{ background: intensityColors[level] }}
                    title={`${date}: ${formatMinutes(mins)}`}
                  />
                )
              })
              return cells
            })()}
          </div>
          <div className="flex items-center gap-2 mt-4 justify-end">
            <span className="text-[9px] text-white/20">Less</span>
            {intensityColors.map((c, i) => (
              <div key={i} className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} />
            ))}
            <span className="text-[9px] text-white/20">More</span>
          </div>
        </div>

        {/* Session list */}
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-white/30 mb-3">All Sessions</p>
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-16">
              <span className="material-symbols-rounded text-white/10 text-5xl block mb-3">timer</span>
              <p className="text-sm text-white/25">No sessions yet. Start your first focus block!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map(s => (
                <div
                  key={s.id}
                  className="rounded-xl px-4 py-3 flex items-center gap-3"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(249,115,22,0.1)' }}>
                    <FeltEmoji score={s.felt_score} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white/80 truncate">
                      {s.task_names?.join(', ') || s.focus_type || 'Deep work'}
                    </p>
                    <p className="text-[10px] text-white/30 mt-0.5">
                      {s.date} · {s.duration_mins}m
                      {s.focus_type && ` · ${s.focus_type}`}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {s.completed && (
                      <span className="material-symbols-rounded text-emerald-400 block" style={{ fontSize: 16 }}>check_circle</span>
                    )}
                    {s.got_distracted && (
                      <span className="material-symbols-rounded text-red-400/60 block" style={{ fontSize: 14 }}>bolt</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
