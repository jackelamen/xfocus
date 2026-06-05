import { create } from 'zustand'

const DEFAULT_POMODORO = 25
const DEFAULT_CUSTOM = 50

// mode: 'pomodoro' | 'flow' | 'custom'
//  - pomodoro/custom: count DOWN from plannedMins; at 0 either auto-stop (strict)
//    or chime + continue into overtime (soft).
//  - flow: count UP, open-ended, until the user stops.

export const useTimerStore = create((set, get) => ({
  mode: 'pomodoro',
  strict: false,             // strict = hard stop at 0; soft = overtime allowed
  plannedMins: DEFAULT_POMODORO,
  elapsedSecs: 0,            // seconds elapsed since start (source of truth)
  running: false,
  overtime: false,          // soft mode: past planned, still counting
  intervalId: null,
  warningFired: false,
  sessionStartedAt: null,

  // Focus context
  activeBlockId: null,
  activeBlockTitle: null,
  activeTaskNames: [],
  selectedTaskId: null,
  selectedTaskName: null,

  // ── Derived helpers ───────────────────────────────────────────
  plannedSecs() {
    const { mode, plannedMins } = get()
    return mode === 'flow' ? 0 : plannedMins * 60
  },
  secsLeft() {
    const { mode, elapsedSecs } = get()
    if (mode === 'flow') return elapsedSecs
    return Math.max(0, get().plannedSecs() - elapsedSecs)
  },
  progress() {
    const { mode, elapsedSecs } = get()
    if (mode === 'flow') return 0
    const total = get().plannedSecs()
    return total > 0 ? Math.min(1, elapsedSecs / total) : 0
  },

  // ── Config (only when idle) ───────────────────────────────────
  setMode(mode) {
    if (get().running) return
    const planned = mode === 'pomodoro' ? DEFAULT_POMODORO : mode === 'custom' ? DEFAULT_CUSTOM : 0
    set({ mode, plannedMins: planned, elapsedSecs: 0, overtime: false, warningFired: false })
  },
  setDuration(mins) {
    if (get().running) return
    // Picking a duration implies a fixed-length timer (custom).
    set({ mode: 'custom', plannedMins: mins, elapsedSecs: 0, overtime: false, warningFired: false })
  },
  setStrict(strict) { set({ strict }) },

  setActiveBlock(block) {
    set({
      activeBlockId: block?.id || null,
      activeBlockTitle: block?.title || null,
      activeTaskNames: block?.task_names || [],
    })
  },
  setSelectedTask(task) {
    set({ selectedTaskId: task?.id || null, selectedTaskName: task?.title || null })
  },

  // ── Run control ───────────────────────────────────────────────
  start(onComplete) {
    const { running } = get()
    if (running) return
    const startedAt = get().sessionStartedAt || new Date().toISOString()
    const id = setInterval(() => {
      const { mode, elapsedSecs, plannedMins, strict, warningFired, overtime } = get()
      const next = elapsedSecs + 1
      const plannedSecs = mode === 'flow' ? 0 : plannedMins * 60

      // 5-minute warning (countdown modes)
      if (mode !== 'flow' && !warningFired && plannedSecs - next === 5 * 60 && plannedSecs > 5 * 60) {
        import('../lib/utils.js').then(m => m.playChime('warning'))
        set({ warningFired: true })
      }

      // Reached planned end (countdown modes)
      if (mode !== 'flow' && !overtime && next >= plannedSecs) {
        import('../lib/utils.js').then(m => m.playChime('complete'))
        if (strict) {
          clearInterval(id)
          set({ running: false, intervalId: null, elapsedSecs: plannedSecs })
          onComplete?.({
            durationMins: Math.max(1, Math.round(plannedSecs / 60)),
            mode, startedAt, endedAt: new Date().toISOString(), autoStopped: true,
          })
          return
        }
        // soft: enter overtime, keep counting
        set({ overtime: true, elapsedSecs: next })
        return
      }

      set({ elapsedSecs: next })
    }, 1000)
    set({ running: true, intervalId: id, sessionStartedAt: startedAt })
  },

  pause() {
    const { intervalId } = get()
    if (intervalId) clearInterval(intervalId)
    set({ running: false, intervalId: null })
  },

  // Stop = finish the session (flow stop, or manual stop in any mode).
  stop(onComplete) {
    const { intervalId, elapsedSecs, mode, sessionStartedAt } = get()
    if (intervalId) clearInterval(intervalId)
    const durationMins = Math.max(1, Math.round(elapsedSecs / 60))
    const startedAt = sessionStartedAt || new Date().toISOString()
    set({ running: false, intervalId: null })
    onComplete?.({ durationMins, mode, startedAt, endedAt: new Date().toISOString(), autoStopped: false })
  },

  reset() {
    const { intervalId } = get()
    if (intervalId) clearInterval(intervalId)
    set({ running: false, intervalId: null, elapsedSecs: 0, overtime: false, warningFired: false, sessionStartedAt: null })
  },

  // Extend the planned length (countdown modes) — pushes the finish line out.
  extend(mins) {
    const { mode } = get()
    if (mode === 'flow') return
    set(s => ({ plannedMins: s.plannedMins + mins, overtime: false }))
  },
}))
