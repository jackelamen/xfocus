import { create } from 'zustand'
import { supabase } from '../lib/supabase.js'
import { todayStr, computeStreak } from '../lib/utils.js'
import { totalXp } from '../lib/progression.js'

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
    set({ sessions: sessions || [] })

    // All sessions for streak + XP + lifetime stats
    const { data: allSessions } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true })
    const all = allSessions || []
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
    const { data, error } = await supabase.from('focus_sessions').insert({ user_id: userId, ...payload }).select().single()
    if (error || !data) return { data, error }

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
