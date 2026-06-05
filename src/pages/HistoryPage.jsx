import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase.js'
import { formatMinutes } from '../lib/utils.js'
import { format, parseISO, startOfWeek, subDays } from 'date-fns'
import {
  totalXp, levelFromXp, lifetimeStats, bestFocusWindow, flowTrend, longestStreak,
} from '../lib/progression.js'

function StoryStat({ icon, value, label, accent }) {
  return (
    <div className="rounded-2xl px-4 py-3.5 flex flex-col gap-1" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-sm)' }}>
      <span className="material-symbols-rounded" style={{ fontSize: 18, color: accent || 'var(--coral-deep)' }}>{icon}</span>
      <p className="text-lg font-extrabold leading-none mt-1" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--ink)' }}>{value}</p>
      <p className="text-[10px] leading-tight" style={{ color: 'var(--ink-3)' }}>{label}</p>
    </div>
  )
}

const HEATMAP_DAYS = 35

function getHeatmapDays() {
  const days = []
  const today = new Date()
  for (let i = HEATMAP_DAYS - 1; i >= 0; i--) {
    days.push(format(subDays(today, i), 'yyyy-MM-dd'))
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

  const today = new Date()
  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const weekSessions = sessions.filter(s => s.date >= weekStart)
  const weekMins = weekSessions.reduce((sum, s) => sum + (s.duration_mins || 0), 0)

  const heatmapDays = getHeatmapDays()

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

  function intensity(date) {
    const mins = (sessionsByDate[date] || []).reduce((sum, s) => sum + (s.duration_mins || 0), 0)
    if (mins === 0) return 0
    if (mins < 25) return 1
    if (mins < 60) return 2
    if (mins < 120) return 3
    return 4
  }

  const intensityColors = [
    'rgba(43,47,68,0.06)',
    'rgba(255,155,115,0.28)',
    'rgba(255,155,115,0.5)',
    'rgba(255,155,115,0.75)',
    'var(--coral)',
  ]

  return (
    <div className="xf-canvas h-screen overflow-y-auto">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-7">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--ink)' }}>History</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--ink-3)' }}>Your deep work record</p>
        </div>

        {/* Level banner + week stat — side by side on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <div
            className="lg:col-span-2 rounded-3xl px-5 py-4 flex items-center gap-4"
            style={{ background: 'var(--surface)', boxShadow: 'var(--shadow)' }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(150deg, var(--coral), var(--peach))' }}>
              <span className="material-symbols-rounded text-white" style={{ fontSize: 24 }}>workspace_premium</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-extrabold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--ink)' }}>{story.lvl.title}</p>
              <p className="text-[11px]" style={{ color: 'var(--ink-3)' }}>Level {story.lvl.level} · {story.xp.toLocaleString()} XP</p>
              <div className="h-1.5 rounded-full overflow-hidden mt-1.5" style={{ background: 'var(--canvas)' }}>
                <div className="h-full rounded-full" style={{ width: `${Math.round(story.lvl.progress * 100)}%`, background: 'linear-gradient(90deg, var(--lav-deep), var(--sky-deep))' }} />
              </div>
            </div>
            {!story.lvl.isMax && (
              <div className="text-right flex-shrink-0">
                <p className="text-[10px]" style={{ color: 'var(--ink-3)' }}>next</p>
                <p className="text-xs font-bold truncate max-w-[90px]" style={{ color: 'var(--coral-deep)' }}>{story.lvl.nextTitle}</p>
              </div>
            )}
          </div>

          <div className="rounded-3xl px-5 py-4 flex items-center gap-4" style={{ background: 'linear-gradient(135deg, rgba(255,201,168,0.4), rgba(255,155,115,0.22))' }}>
            <div>
              <p className="text-3xl font-extrabold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--coral-deep)' }}>{formatMinutes(weekMins)}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--ink-2)' }}>this week</p>
            </div>
            <div className="flex-1" />
            <div className="text-right">
              <p className="text-lg font-extrabold" style={{ color: 'var(--ink)' }}>{weekSessions.length}</p>
              <p className="text-xs" style={{ color: 'var(--ink-3)' }}>sessions</p>
            </div>
          </div>
        </div>

        {/* Story stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <StoryStat icon="hourglass_top" value={`${story.life.yearHours}h`} label={`deep work in ${new Date().getFullYear()}`} />
          <StoryStat icon="bolt" value={story.longest || '0'} label="longest streak (days)" accent="var(--lav-deep)" />
          <StoryStat icon="wb_twilight" value={story.best ? story.best.label : '—'} label="your peak focus window" accent="var(--sky-deep)" />
          <StoryStat
            icon={story.trend && story.trend.delta >= 0 ? 'trending_up' : 'trending_down'}
            value={story.trend ? story.trend.recent.toFixed(1) : '—'}
            label={story.trend ? `flow quality (${story.trend.delta >= 0 ? '+' : ''}${story.trend.delta} trend)` : 'flow quality'}
            accent={story.trend && story.trend.delta >= 0 ? 'var(--sky-deep)' : 'var(--coral-deep)'}
          />
        </div>

        {/* Heatmap + session list — two columns on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">

          {/* Heatmap */}
          <div className="lg:col-span-2 rounded-3xl p-5" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-sm)' }}>
            <p className="text-[11px] font-extrabold uppercase tracking-wider mb-4" style={{ color: 'var(--ink-3)' }}>Activity · last 5 weeks</p>
            <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {['M','T','W','T','F','S','S'].map((d, i) => (
                <div key={i} className="text-center text-[9px] font-bold mb-1" style={{ color: 'var(--ink-4)' }}>{d}</div>
              ))}
              {(() => {
                const firstDay = parseISO(heatmapDays[0])
                const dow = firstDay.getDay()
                const startPad = dow === 0 ? 6 : dow - 1
                const cells = []
                for (let i = 0; i < startPad; i++) cells.push(<div key={`pad-${i}`} />)
                heatmapDays.forEach(date => {
                  const level = intensity(date)
                  const mins = (sessionsByDate[date] || []).reduce((s, x) => s + (x.duration_mins || 0), 0)
                  cells.push(
                    <div key={date} className="aspect-square rounded-md" style={{ background: intensityColors[level] }} title={`${date}: ${formatMinutes(mins)}`} />
                  )
                })
                return cells
              })()}
            </div>
            <div className="flex items-center gap-2 mt-4 justify-end">
              <span className="text-[9px]" style={{ color: 'var(--ink-4)' }}>Less</span>
              {intensityColors.map((c, i) => (
                <div key={i} className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} />
              ))}
              <span className="text-[9px]" style={{ color: 'var(--ink-4)' }}>More</span>
            </div>
          </div>

          {/* Session list */}
          <div className="lg:col-span-3">
            <p className="text-[11px] font-extrabold uppercase tracking-wider mb-3" style={{ color: 'var(--ink-3)' }}>All sessions</p>
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--coral)', borderTopColor: 'transparent' }} />
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-16 rounded-3xl" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-sm)' }}>
                <span className="material-symbols-rounded text-5xl block mb-3" style={{ color: 'var(--ink-4)' }}>timer</span>
                <p className="text-sm" style={{ color: 'var(--ink-3)' }}>No sessions yet. Start your first focus block!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.map(s => (
                  <div key={s.id} className="rounded-2xl px-4 py-3 flex items-center gap-3" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-sm)' }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--canvas)' }}>
                      <FeltEmoji score={s.felt_score} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: 'var(--ink)' }}>
                        {s.task_names?.join(', ') || s.focus_type || 'Deep work'}
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--ink-3)' }}>
                        {s.date} · {s.duration_mins}m{s.focus_type && ` · ${s.focus_type}`}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {s.completed && (
                        <span className="material-symbols-rounded block" style={{ fontSize: 16, color: 'var(--sky-deep)' }}>check_circle</span>
                      )}
                      {s.got_distracted && (
                        <span className="material-symbols-rounded block" style={{ fontSize: 14, color: 'var(--lav-deep)' }}>bolt</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
