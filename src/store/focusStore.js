import { create } from 'zustand'
import { supabase } from '../lib/supabase.js'
import { todayStr, computeStreak } from '../lib/utils.js'
import { totalXp } from '../lib/progression.js'

// focus_sessions is SHARED with Pulse. Pulse uses actual_minutes/planned_minutes
// and `note`; xFocus thinks in duration_mins/notes. Normalize on read so xFocus
// sees Pulse-created sessions too, and denormalize on write so both apps stay
// consistent. Unknown/legacy rows (no xFocus review fields) degrade gracefully.
export function normalizeSession(row) {
  if (!row) return row
  const duration = row.duration_mins ?? row.actual_minutes ?? row.planned_minutes ?? 0
  return {
    ...row,
    duration_mins: duration,
    notes: row.notes ?? row.note ?? null,
    // A Pulse session with no xFocus completion flag still counts as done work
    // for streak/history if it has real minutes logged.
    completed: row.completed ?? (duration > 0),
    date: row.date || (row.started_at ? row.started_at.slice(0, 10) : null),
  }
}

function denormalizeForWrite(payload) {
  const out = { ...payload }
  if (payload.duration_mins != null) {
    out.actual_minutes = payload.duration_mins
    out.planned_minutes = payload.duration_mins
  }
  if (payload.notes != null) out.note = payload.notes
  delete out.duration_mins
  delete out.notes
  return out
}

export const useFocusStore = create((set, get) => ({
  intention: null,
  intentionLoading: false,
  sessions: [],         // today's focus_sessions
  allSessions: [],      // every focus_session (for XP/levels/stats)
  allSessionDates: [],  // all dates with sessions (for streak)
  xp: 0,                // lifetime XP derived from allSessions
  streak: 0,
  distractions: [],     // today's distractions

  async loadAll(userId) {
    const today = todayStr()

    // Intention
    const { data: intentionRow } = await supabase
      .from('intentions')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle()
    set({ intention: intentionRow })

    // Today's sessions
    const { data: sessions } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .order('started_at', { ascending: true })
    set({ sessions: (sessions || []).map(normalizeSession) })

    // All sessions for streak + XP + lifetime stats
    const { data: allSessions } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true })
    const all = (allSessions || []).map(normalizeSession)
    const completed = all.filter(s => s.completed)
    const dates = [...new Set(completed.map(s => s.date))]
    const streak = computeStreak(dates)
    set({ allSessions: all, allSessionDates: dates, streak, xp: totalXp(all) })

    // Today's distractions
    const { data: distractions } = await supabase
      .from('distractions')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .order('logged_at', { ascending: true })
    set({ distractions: distractions || [] })
  },

  async saveIntention(userId, text) {
    const today = todayStr()
    const { intention } = get()
    set({ intentionLoading: true })
    let row
    if (intention?.id) {
      const { data } = await supabase.from('intentions').update({ text }).eq('id', intention.id).select().single()
      row = data
    } else {
      const { data } = await supabase.from('intentions').insert({ user_id: userId, date: today, text }).select().single()
      row = data
    }
    set({ intention: row, intentionLoading: false })
  },

  async saveSession(userId, payload) {
    const insertRow = denormalizeForWrite({ user_id: userId, ...payload })
    const { data: raw, error } = await supabase.from('focus_sessions').insert(insertRow).select().single()
    if (error || !raw) return { data: raw, error }
    const data = normalizeSession(raw)

    const prev = get()
    const prevXp = prev.xp
    const prevStreak = prev.streak

    const allSessions = [...prev.allSessions, data]
    const sessions = [...prev.sessions, data]
    const dates = [...new Set(allSessions.filter(s => s.completed).map(s => s.date))]
    const streak = computeStreak(dates)
    const xp = totalXp(allSessions)

    set({ allSessions, sessions, allSessionDates: dates, streak, xp })

    return {
      data,
      error: null,
      reward: {
        gainedXp: xp - prevXp,
        prevXp,
        newXp: xp,
        prevStreak,
        newStreak: streak,
        streakUp: streak > prevStreak,
      },
    }
  },

  async logDistraction(userId, label, sessionId = null) {
    const today = todayStr()
    const { data } = await supabase
      .from('distractions')
      .insert({ user_id: userId, date: today, label, session_id: sessionId })
      .select()
      .single()
    if (data) set(s => ({ distractions: [...s.distractions, data] }))
    return data
  },
}))
