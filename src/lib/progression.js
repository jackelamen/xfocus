// Progression system: turns logged deep work into XP, levels, titles, and stats.
// All derived client-side from focus_sessions — no schema change required.

import { startOfDay, isWeekend, format, parseISO } from 'date-fns'

export const DAILY_GOAL_MINS = 120 // 2 focused hours = a "full" day ring

// ── XP ──────────────────────────────────────────────────────────
// Base: 1 XP per focused minute. Multipliers reward quality + completion.
export function sessionXp(session) {
  const mins = session.duration_mins || 0
  let xp = mins
  // Flow quality bonus (felt_score 1-5): up to +50%
  if (session.felt_score) xp *= 1 + (session.felt_score - 3) * 0.125 // 3 = neutral
  // Completion bonus
  if (session.task_completed === 'yes') xp += 25
  else if (session.task_completed === 'partial') xp += 10
  // Clean-focus bonus
  if (session.got_distracted === false) xp += 15
  return Math.max(0, Math.round(xp))
}

export function totalXp(sessions) {
  return (sessions || []).reduce((sum, s) => sum + sessionXp(s), 0)
}

// ── Levels ──────────────────────────────────────────────────────
// Smoothly escalating thresholds. Each level needs more than the last.
// Title tiers evoke a craft you're mastering.
const LEVELS = [
  { level: 1,  xp: 0,      title: 'Initiate' },
  { level: 2,  xp: 300,    title: 'Apprentice' },
  { level: 3,  xp: 800,    title: 'Practitioner' },
  { level: 4,  xp: 1600,   title: 'Focused Mind' },
  { level: 5,  xp: 2800,   title: 'Deep Worker' },
  { level: 6,  xp: 4500,   title: 'Concentrator' },
  { level: 7,  xp: 6800,   title: 'Flow Seeker' },
  { level: 8,  xp: 9800,   title: 'Flow Finder' },
  { level: 9,  xp: 13600,  title: 'Deep Diver' },
  { level: 10, xp: 18500,  title: 'Flow Architect' },
  { level: 11, xp: 24800,  title: 'Attention Master' },
  { level: 12, xp: 32500,  title: 'Mind Sculptor' },
  { level: 13, xp: 42000,  title: 'Sage of Focus' },
  { level: 14, xp: 53500,  title: 'Luminary' },
  { level: 15, xp: 67000,  title: 'Grandmaster of Depth' },
]

export function levelFromXp(xp) {
  let current = LEVELS[0]
  let next = null
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].xp) {
      current = LEVELS[i]
      next = LEVELS[i + 1] || null
    } else break
  }
  const floor = current.xp
  const ceil = next ? next.xp : current.xp
  const span = ceil - floor
  const into = xp - floor
  const progress = next ? Math.min(1, into / span) : 1
  return {
    level: current.level,
    title: current.title,
    xpIntoLevel: into,
    xpForLevel: next ? span : into,
    xpToNext: next ? ceil - xp : 0,
    progress,
    nextTitle: next?.title || null,
    isMax: !next,
  }
}

// Did saving `newSession` push the user past a level boundary?
export function detectLevelUp(prevXp, newXp) {
  const before = levelFromXp(prevXp).level
  const after = levelFromXp(newXp).level
  return after > before ? levelFromXp(newXp) : null
}

// ── Aggregate stats for the "story" ─────────────────────────────
export function lifetimeStats(sessions) {
  const list = sessions || []
  const totalMins = list.reduce((s, x) => s + (x.duration_mins || 0), 0)
  const count = list.length
  const year = new Date().getFullYear()
  const yearMins = list
    .filter(s => s.date && s.date.startsWith(String(year)))
    .reduce((s, x) => s + (x.duration_mins || 0), 0)
  const avgFelt = count
    ? list.reduce((s, x) => s + (x.felt_score || 0), 0) / list.filter(x => x.felt_score).length || 0
    : 0
  return {
    totalMins,
    totalHours: Math.round(totalMins / 6) / 10,
    yearMins,
    yearHours: Math.round(yearMins / 6) / 10,
    count,
    avgFelt: Math.round(avgFelt * 10) / 10,
  }
}

// Best focus window: which hour of day yields the highest avg felt_score.
export function bestFocusWindow(sessions) {
  const buckets = {}
  ;(sessions || []).forEach(s => {
    if (!s.started_at || !s.felt_score) return
    const h = new Date(s.started_at).getHours()
    if (!buckets[h]) buckets[h] = { sum: 0, n: 0 }
    buckets[h].sum += s.felt_score
    buckets[h].n += 1
  })
  let best = null
  Object.entries(buckets).forEach(([h, { sum, n }]) => {
    if (n < 2) return
    const avg = sum / n
    if (!best || avg > best.avg) best = { hour: Number(h), avg, n }
  })
  if (!best) return null
  const label = (h) => {
    const ampm = h < 12 ? 'am' : 'pm'
    const hr = h % 12 === 0 ? 12 : h % 12
    return `${hr}${ampm}`
  }
  return { ...best, label: `${label(best.hour)}–${label((best.hour + 1) % 24)}` }
}

// Flow trend: avg felt_score over the last N sessions vs the prior N.
export function flowTrend(sessions) {
  const scored = (sessions || [])
    .filter(s => s.felt_score)
    .sort((a, b) => (a.started_at || a.date).localeCompare(b.started_at || b.date))
  if (scored.length < 4) return null
  const n = Math.min(7, Math.floor(scored.length / 2))
  const recent = scored.slice(-n)
  const prior = scored.slice(-2 * n, -n)
  const avg = (arr) => arr.reduce((s, x) => s + x.felt_score, 0) / arr.length
  const r = avg(recent), p = avg(prior)
  return { recent: Math.round(r * 10) / 10, delta: Math.round((r - p) * 10) / 10 }
}

// Longest streak ever (weekday-aware, matches computeStreak logic).
export function longestStreak(sessionDates) {
  const set = new Set(sessionDates)
  if (!set.size) return 0
  const sorted = [...set].sort()
  let longest = 0, run = 0
  let cursor = startOfDay(parseISO(sorted[0]))
  const end = startOfDay(new Date())
  const nextDay = (d) => new Date(d.getTime() + 86400000)
  while (cursor <= end) {
    if (isWeekend(cursor)) { cursor = nextDay(cursor); continue }
    const ds = format(cursor, 'yyyy-MM-dd')
    if (set.has(ds)) { run += 1; longest = Math.max(longest, run) }
    else run = 0
    cursor = nextDay(cursor)
  }
  return longest
}
