import { create } from 'zustand'

const DEFAULT_DURATION = 50 // minutes

export const useTimerStore = create((set, get) => ({
  // State
  durationMins: DEFAULT_DURATION,
  secsLeft: DEFAULT_DURATION * 60,
  secsTotal: DEFAULT_DURATION * 60,
  running: false,
  intervalId: null,
  warningFired: false,
  activeBlockId: null,      // time_block id currently being focused on
  activeBlockTitle: null,
  activeTaskNames: [],
  sessionStartedAt: null,

  // Actions
  setDuration(mins) {
    const { running } = get()
    if (running) return
    set({ durationMins: mins, secsLeft: mins * 60, secsTotal: mins * 60, warningFired: false })
  },

  setActiveBlock(block) {
    set({
      activeBlockId: block?.id || null,
      activeBlockTitle: block?.title || null,
      activeTaskNames: block?.task_names || [],
    })
  },

  start(onComplete) {
    const { running, secsLeft } = get()
    if (running || secsLeft <= 0) return
    const startedAt = new Date().toISOString()
    const id = setInterval(() => {
      const { secsLeft, warningFired, durationMins } = get()
      const next = secsLeft - 1
      // 5-minute warning
      if (!warningFired && next === 5 * 60) {
        import('../lib/utils.js').then(m => m.playChime('warning'))
        set({ warningFired: true })
      }
      if (next <= 0) {
        clearInterval(id)
        import('../lib/utils.js').then(m => m.playChime('complete'))
        set({ running: false, intervalId: null, secsLeft: 0 })
        onComplete?.({ durationMins, startedAt, endedAt: new Date().toISOString() })
      } else {
        set({ secsLeft: next })
      }
    }, 1000)
    set({ running: true, intervalId: id, sessionStartedAt: startedAt })
  },

  pause() {
    const { intervalId } = get()
    if (intervalId) clearInterval(intervalId)
    set({ running: false, intervalId: null })
  },

  reset() {
    const { intervalId, durationMins } = get()
    if (intervalId) clearInterval(intervalId)
    set({ running: false, intervalId: null, secsLeft: durationMins * 60, secsTotal: durationMins * 60, warningFired: false, sessionStartedAt: null })
  },

  extend(mins) {
    set(s => ({ secsLeft: s.secsLeft + mins * 60, secsTotal: s.secsTotal + mins * 60 }))
  },
}))
