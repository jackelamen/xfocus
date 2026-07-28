import React, { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { usePulseTasks } from '../../hooks/usePulseTasks.js'
import { useBlocksStore } from '../../store/blocksStore.js'
import {
  timeToMinutes, minutesToTime, formatMinutes, dueBucket, dueLabel,
  todayStr, monthDayShort,
} from '../../lib/utils.js'

const DEFAULT_START = '09:00'
const DEFAULT_END = '17:00'
const DEFAULT_SESSION = 45      // fallback length when a task has no estimate
const BREAK_MIN = 10            // breathing room between suggested blocks
const MIN_SESSION = 15
const MAX_SESSION = 120

// Urgency score — lower sorts first.
function rank(task) {
  const bucket = dueBucket(task.due_date)
  const bucketRank = { overdue: 0, today: 1, tomorrow: 2, week: 3, later: 4, none: 5 }[bucket] ?? 5
  const prioRank = { urgent: 0, high: 1, low: 3, none: 2 }[task.priority] ?? 2
  return bucketRank * 10 + prioRank
}

// Free gaps (in minutes-from-midnight) inside the working window, given the
// blocks already on that day.
function freeGaps(blocks, windowStart, windowEnd) {
  const busy = blocks
    .map(b => ({ start: timeToMinutes(b.start_time), end: timeToMinutes(b.end_time) }))
    .filter(b => b.end > windowStart && b.start < windowEnd)
    .sort((a, b) => a.start - b.start)

  const gaps = []
  let cursor = windowStart
  for (const b of busy) {
    if (b.start > cursor) gaps.push({ start: cursor, end: Math.min(b.start, windowEnd) })
    cursor = Math.max(cursor, b.end)
    if (cursor >= windowEnd) break
  }
  if (cursor < windowEnd) gaps.push({ start: cursor, end: windowEnd })
  return gaps.filter(g => g.end - g.start >= MIN_SESSION)
}

const COLOR_FOR_BUCKET = {
  overdue: '#ff7a5c',
  today: '#ff9b73',
  tomorrow: '#ffc48a',
  week: '#9b8fe0',
  later: '#8fb8e0',
  none: '#8fb8e0',
}

/**
 * "Plan my day" — proposes time blocks for the most urgent open Pulse tasks,
 * packed into the gaps left by whatever is already scheduled.
 *
 * Nothing is written until the user confirms, and each suggestion can be
 * dropped or resized first.
 */
export default function DayPlanner({ user, date, blocks, onClose }) {
  const { tasks, loading } = usePulseTasks(user.id)
  const createBlocks = useBlocksStore(s => s.createBlocks)

  const [startTime, setStartTime] = useState(DEFAULT_START)
  const [endTime, setEndTime] = useState(DEFAULT_END)
  const [sessionLen, setSessionLen] = useState(DEFAULT_SESSION)
  const [useEstimates, setUseEstimates] = useState(true)
  const [dropped, setDropped] = useState(new Set())
  const [saving, setSaving] = useState(false)

  const dayBlocks = useMemo(() => blocks.filter(b => b.date === date), [blocks, date])

  // Tasks already scheduled somewhere on this day shouldn't be proposed again.
  const alreadyScheduled = useMemo(
    () => new Set(dayBlocks.flatMap(b => b.task_ids || [])),
    [dayBlocks]
  )

  const suggestions = useMemo(() => {
    const windowStart = timeToMinutes(startTime)
    const windowEnd = timeToMinutes(endTime)
    if (windowEnd - windowStart < MIN_SESSION) return []

    const candidates = [...tasks]
      .filter(t => !alreadyScheduled.has(t.id))
      // Undated, low-priority work is left out — this plans the pressing stuff.
      .filter(t => dueBucket(t.due_date) !== 'none' || t.priority === 'urgent' || t.priority === 'high')
      .sort((a, b) => rank(a) - rank(b) || String(a.title).localeCompare(String(b.title)))

    const gaps = freeGaps(dayBlocks, windowStart, windowEnd)
    const out = []
    let gi = 0
    let cursor = gaps[0]?.start ?? null

    for (const task of candidates) {
      if (gi >= gaps.length) break
      const want = clampSession(
        useEstimates && task.duration_minutes ? task.duration_minutes : sessionLen
      )
      // Walk forward until a gap can hold at least a minimum session.
      while (gi < gaps.length && gaps[gi].end - Math.max(cursor, gaps[gi].start) < MIN_SESSION) {
        gi += 1
        cursor = gaps[gi]?.start ?? null
      }
      if (gi >= gaps.length) break
      const gap = gaps[gi]
      const start = Math.max(cursor, gap.start)
      const len = Math.min(want, gap.end - start)
      const end = start + len
      const bucket = dueBucket(task.due_date)

      out.push({
        task,
        start,
        end,
        color: COLOR_FOR_BUCKET[bucket] || '#ff9b73',
        truncated: len < want,
      })

      cursor = end + BREAK_MIN
      if (cursor >= gap.end - MIN_SESSION) { gi += 1; cursor = gaps[gi]?.start ?? null }
    }
    return out
  }, [tasks, dayBlocks, alreadyScheduled, startTime, endTime, sessionLen, useEstimates])

  const kept = suggestions.filter(s => !dropped.has(s.task.id))

  async function apply() {
    if (kept.length === 0) return
    setSaving(true)
    const { error } = await createBlocks(user.id, kept.map(s => ({
      date,
      title: s.task.title,
      start_time: minutesToTime(s.start),
      end_time: minutesToTime(s.end),
      color: s.color,
      task_ids: [s.task.id],
      task_names: [s.task.title],
      focus_type: 'Other',
    })))
    setSaving(false)
    if (error) { toast.error('Could not create blocks'); return }
    toast.success(`Scheduled ${kept.length} block${kept.length === 1 ? '' : 's'}`)
    onClose()
  }

  const fieldStyle = { background: 'var(--canvas)', color: 'var(--ink)', border: '1px solid var(--line-2)' }
  const labelCls = 'block text-[10px] font-extrabold uppercase tracking-wider mb-1.5'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(43,47,68,0.45)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-[24px] overflow-hidden flex flex-col" style={{ background: 'var(--surface)', boxShadow: '0 30px 70px rgba(70,90,140,0.35)', maxHeight: '86vh' }}>
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between flex-shrink-0" style={{ background: 'rgba(255,155,115,0.14)' }}>
          <div>
            <h3 className="font-extrabold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--ink)' }}>Plan my day</h3>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--ink-3)' }}>
              {date === todayStr() ? 'Today' : monthDayShort(date)} · fills the gaps around what's already booked
            </p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ color: 'var(--ink-3)' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>close</span>
          </button>
        </div>

        {/* Controls */}
        <div className="px-5 pt-4 pb-3 flex-shrink-0 space-y-3" style={{ borderBottom: '1px solid var(--line)' }}>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className={labelCls} style={{ color: 'var(--ink-3)' }}>From</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-sm font-medium outline-none" style={fieldStyle} />
            </div>
            <div>
              <label className={labelCls} style={{ color: 'var(--ink-3)' }}>To</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-sm font-medium outline-none" style={fieldStyle} />
            </div>
            <div>
              <label className={labelCls} style={{ color: 'var(--ink-3)' }}>Session</label>
              <select value={sessionLen} onChange={e => setSessionLen(Number(e.target.value))}
                className="w-full rounded-xl px-3 py-2 text-sm font-medium outline-none" style={fieldStyle}>
                {[25, 30, 45, 60, 90].map(n => <option key={n} value={n}>{n}m</option>)}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={useEstimates} onChange={e => setUseEstimates(e.target.checked)} />
            <span className="text-[11px]" style={{ color: 'var(--ink-2)' }}>
              Use each task's Pulse estimate when it has one
            </span>
          </label>
        </div>

        {/* Suggestions */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--coral)', borderTopColor: 'transparent' }} />
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-10">
              <span className="material-symbols-rounded text-3xl block mb-2" style={{ color: 'var(--ink-4)' }}>event_available</span>
              <p className="text-xs" style={{ color: 'var(--ink-3)' }}>
                Nothing to schedule. Either the day is full, or there are no dated or high-priority tasks left in Pulse.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {suggestions.map(s => {
                const off = dropped.has(s.task.id)
                return (
                  <div
                    key={s.task.id}
                    className="flex items-center gap-2 rounded-xl px-2.5 py-2 transition-opacity"
                    style={{
                      background: 'var(--canvas)',
                      border: `1px solid ${off ? 'var(--line-2)' : s.color + '66'}`,
                      opacity: off ? 0.45 : 1,
                    }}
                  >
                    <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: s.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: 'var(--ink)' }}>{s.task.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[10px] font-bold tabular-nums" style={{ color: 'var(--ink-2)' }}>
                          {minutesToTime(s.start)}–{minutesToTime(s.end)}
                        </span>
                        <span className="text-[10px]" style={{ color: 'var(--ink-3)' }}>{formatMinutes(s.end - s.start)}</span>
                        {s.task.due_date && (
                          <span className="text-[10px]" style={{ color: dueBucket(s.task.due_date) === 'overdue' ? 'var(--coral-deep)' : 'var(--ink-3)' }}>
                            {dueLabel(s.task.due_date)}
                          </span>
                        )}
                        {s.truncated && (
                          <span className="text-[9px] font-bold" style={{ color: 'var(--ink-4)' }}>trimmed to fit</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setDropped(cur => {
                        const next = new Set(cur)
                        next.has(s.task.id) ? next.delete(s.task.id) : next.add(s.task.id)
                        return next
                      })}
                      className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ color: off ? 'var(--sky-deep)' : 'var(--ink-4)' }}
                      title={off ? 'Put back' : 'Skip this one'}
                    >
                      <span className="material-symbols-rounded" style={{ fontSize: 15 }}>{off ? 'undo' : 'close'}</span>
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 flex gap-2 flex-shrink-0" style={{ borderTop: '1px solid var(--line)' }}>
          <button
            onClick={apply}
            disabled={saving || kept.length === 0}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40"
            style={{ background: 'linear-gradient(150deg, var(--coral), var(--coral-deep))' }}
          >
            {saving
              ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              : <><span className="material-symbols-rounded text-base">auto_awesome</span> Schedule {kept.length || ''}</>
            }
          </button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl font-bold text-sm" style={{ background: 'var(--canvas)', color: 'var(--ink-2)' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function clampSession(n) {
  return Math.max(MIN_SESSION, Math.min(MAX_SESSION, Math.round(n)))
}
