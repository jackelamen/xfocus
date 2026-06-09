import { format, isWeekend, subDays, startOfDay } from 'date-fns'

export function todayStr() {
  return format(new Date(), 'yyyy-MM-dd')
}

export function tomorrowStr() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return format(d, 'yyyy-MM-dd')
}

// Classify a yyyy-MM-dd due date string into a bucket relative to today.
// Returns 'none' | 'overdue' | 'today' | 'tomorrow' | 'week' | 'later'.
// "week" = within the next 7 days (after tomorrow). Overdue counts as 'today'
// for filtering purposes so past-due items surface with today's work.
export function dueBucket(dueDateStr) {
  if (!dueDateStr) return 'none'
  const today = todayStr()
  const tomorrow = tomorrowStr()
  if (dueDateStr < today) return 'overdue'
  if (dueDateStr === today) return 'today'
  if (dueDateStr === tomorrow) return 'tomorrow'
  const in7 = new Date()
  in7.setDate(in7.getDate() + 7)
  const weekEnd = format(in7, 'yyyy-MM-dd')
  if (dueDateStr <= weekEnd) return 'week'
  return 'later'
}

// Short human label for a due date string (e.g. "Today", "Tomorrow", "Jun 14").
export function dueLabel(dueDateStr) {
  if (!dueDateStr) return null
  const b = dueBucket(dueDateStr)
  if (b === 'today') return 'Today'
  if (b === 'tomorrow') return 'Tomorrow'
  if (b === 'overdue') return `Overdue · ${format(new Date(dueDateStr), 'MMM d')}`
  return format(new Date(dueDateStr), 'MMM d')
}

export function formatMinutes(mins) {
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

export function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0')
  const s = (secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export function timeToMinutes(timeStr) {
  // '09:30' -> 570
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

export function minutesToTime(mins) {
  const h = Math.floor(mins / 60).toString().padStart(2, '0')
  const m = (mins % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}

export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val))
}

// Play a simple chime using Web Audio API
let _audioCtx = null
function getAudioCtx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  return _audioCtx
}

export function playChime(type = 'complete') {
  try {
    const ctx = getAudioCtx()
    if (ctx.state === 'suspended') ctx.resume()
    let tones
    if (type === 'warning') {
      tones = [{ f: 880, t: 0.0, d: 0.3 }]
    } else if (type === 'celebrate') {
      tones = [
        { f: 523.25, t: 0.0,  d: 0.5 },
        { f: 659.25, t: 0.1,  d: 0.5 },
        { f: 783.99, t: 0.2,  d: 0.5 },
        { f: 1046.5, t: 0.32, d: 0.7 },
        { f: 1318.5, t: 0.32, d: 0.7 },
      ]
    } else if (type === 'levelup') {
      tones = [
        { f: 392.0,  t: 0.0,  d: 0.4 },
        { f: 523.25, t: 0.12, d: 0.4 },
        { f: 659.25, t: 0.24, d: 0.4 },
        { f: 880.0,  t: 0.36, d: 0.8 },
      ]
    } else {
      tones = [
        { f: 523.25, t: 0.0,  d: 0.4 },
        { f: 659.25, t: 0.25, d: 0.4 },
        { f: 783.99, t: 0.5,  d: 0.6 },
      ]
    }
    tones.forEach(({ f, t, d }) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = f
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.16, ctx.currentTime + t)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + d)
      osc.start(ctx.currentTime + t)
      osc.stop(ctx.currentTime + t + d + 0.05)
    })
  } catch (_) {}
}

// ── Ambient soundscapes (generated, no asset files) ─────────────
// Returns a controller: { stop(), setVolume(v) }. type: 'brown' | 'rain' | 'hum'
export function startAmbient(type = 'brown', volume = 0.25) {
  try {
    const ctx = getAudioCtx()
    if (ctx.state === 'suspended') ctx.resume()
    const master = ctx.createGain()
    master.gain.value = volume
    master.connect(ctx.destination)

    const nodes = []
    const bufferSize = 2 * ctx.sampleRate
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const out = noiseBuffer.getChannelData(0)

    if (type === 'brown') {
      let last = 0
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        out[i] = (last + 0.02 * white) / 1.02
        last = out[i]
        out[i] *= 3.5
      }
    } else {
      for (let i = 0; i < bufferSize; i++) out[i] = Math.random() * 2 - 1
    }

    const src = ctx.createBufferSource()
    src.buffer = noiseBuffer
    src.loop = true

    let chain = src
    if (type === 'rain') {
      const hp = ctx.createBiquadFilter()
      hp.type = 'highpass'; hp.frequency.value = 1000
      const lp = ctx.createBiquadFilter()
      lp.type = 'lowpass'; lp.frequency.value = 8000
      src.connect(hp); hp.connect(lp); chain = lp
      nodes.push(hp, lp)
    } else if (type === 'hum') {
      const lp = ctx.createBiquadFilter()
      lp.type = 'lowpass'; lp.frequency.value = 220
      src.connect(lp); chain = lp
      nodes.push(lp)
      const osc = ctx.createOscillator()
      const og = ctx.createGain()
      osc.frequency.value = 110; osc.type = 'sine'; og.gain.value = 0.06
      osc.connect(og); og.connect(master); osc.start()
      nodes.push(osc, og)
    } else {
      const lp = ctx.createBiquadFilter()
      lp.type = 'lowpass'; lp.frequency.value = 1200
      src.connect(lp); chain = lp
      nodes.push(lp)
    }

    chain.connect(master)
    src.start()
    nodes.push(src, master)

    return {
      stop() {
        try { src.stop() } catch (_) {}
        nodes.forEach(n => { try { n.disconnect() } catch (_) {} ; try { n.stop && n.stop() } catch (_) {} })
        try { master.disconnect() } catch (_) {}
      },
      setVolume(v) { master.gain.setTargetAtTime(v, ctx.currentTime, 0.1) },
    }
  } catch (_) {
    return { stop() {}, setVolume() {} }
  }
}

// Compute weekday streak from array of date strings with at least 1 session
export function computeStreak(sessionDates) {
  if (!sessionDates.length) return 0
  const dateSet = new Set(sessionDates)
  let streak = 0
  let d = startOfDay(new Date())
  // Start from yesterday if today has no session yet
  while (true) {
    const ds = format(d, 'yyyy-MM-dd')
    if (isWeekend(d)) {
      d = subDays(d, 1)
      continue
    }
    if (dateSet.has(ds)) {
      streak++
      d = subDays(d, 1)
    } else {
      break
    }
  }
  return streak
}

export const FOCUS_TYPES = ['Writing', 'Coding', 'Strategy', 'Research', 'Design', 'Reading', 'Planning', 'Other']

export const BLOCK_COLORS = [
  '#f97316', // orange (default)
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#10b981', // emerald
  '#ec4899', // pink
  '#f59e0b', // amber
  '#06b6d4', // cyan
  '#64748b', // slate
]
