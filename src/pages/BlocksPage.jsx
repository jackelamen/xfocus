import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, pointerWithin } from '@dnd-kit/core'
import toast from 'react-hot-toast'
import { useBlocksStore } from '../store/blocksStore.js'
import { useTimerStore } from '../store/timerStore.js'
import { useTasksByIds } from '../hooks/usePulseTasks.js'
import PulseTaskPanel from '../components/blocks/PulseTaskPanel.jsx'
import BlockForm from '../components/blocks/BlockForm.jsx'
import DayPlanner from '../components/blocks/DayPlanner.jsx'
import DayColumn from '../components/blocks/DayColumn.jsx'
import { HOURS, TOTAL_MINS, hourLabel } from '../lib/timeline.js'
import {
  todayStr, tomorrowStr, addDaysStr, weekStartStr, weekdayShort, monthDayShort, parseDateStr,
  timeToMinutes,
} from '../lib/utils.js'
import { findConflicts, blockRange, overlaps } from '../lib/overlap.js'

const PX_PER_MIN_DAY = 1.4
const PX_PER_MIN_WEEK = 0.9

export default function BlocksPage({ user }) {
  const navigate = useNavigate()
  const {
    blocks, viewDate, viewMode, setViewDate, setViewMode,
    loadBlocks, addTaskToBlock, removeTaskFromBlock, createBlock, updateBlock,
  } = useBlocksStore()
  const setActiveBlock = useTimerStore(s => s.setActiveBlock)

  const [formBlock, setFormBlock] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [plannerOpen, setPlannerOpen] = useState(false)
  const [activeDrag, setActiveDrag] = useState(null)
  const [panelOpen, setPanelOpen] = useState(false)   // mobile drawer
  const timelineRef = useRef(null)

  useEffect(() => { loadBlocks(user.id) }, [user.id, viewDate, viewMode])

  const week = viewMode === 'week'
  const pxPerMin = week ? PX_PER_MIN_WEEK : PX_PER_MIN_DAY
  const timelineHeight = TOTAL_MINS * pxPerMin

  const dates = useMemo(() => {
    if (!week) return [viewDate]
    const start = weekStartStr(viewDate)
    return Array.from({ length: 7 }, (_, i) => addDaysStr(start, i))
  }, [week, viewDate])

  // Live Pulse data for every task attached to a visible block — powers the
  // chips (titles, completion state, links) without a fetch per block.
  const attachedIds = useMemo(() => blocks.flatMap(b => b.task_ids || []), [blocks])
  const { taskMap } = useTasksByIds(user.id, attachedIds)

  const byDate = useMemo(() => {
    const m = new Map(dates.map(d => [d, []]))
    for (const b of blocks) if (m.has(b.date)) m.get(b.date).push(b)
    return m
  }, [blocks, dates])

  // How many blocks in view sit on top of another one.
  const clashCount = useMemo(() => {
    let n = 0
    for (const [, dayBlocks] of byDate) {
      for (let i = 0; i < dayBlocks.length; i++) {
        const r = blockRange(dayBlocks[i])
        if (dayBlocks.some((o, j) => j !== i && overlaps(r, blockRange(o)))) n++
      }
    }
    return n
  }, [byDate])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  function handleFocusNow(block) {
    setActiveBlock(block)
    navigate('/focus')
  }

  async function handleRemoveTask(block, taskId) {
    const res = await removeTaskFromBlock(block.id, taskId)
    if (res?.error) toast.error('Could not remove task')
    else toast.success('Removed from block')
  }

  function handleDragStart({ active }) {
    if (active.data.current?.type === 'task') setActiveDrag(active.data.current.task)
  }

  async function handleDragEnd({ active, over }) {
    setActiveDrag(null)
    if (!over) return
    const task = active.data.current?.task
    if (!task) return
    const overId = String(over.id)
    if (overId.startsWith('block-')) {
      const res = await addTaskToBlock(overId.replace('block-', ''), task.id, task.title)
      if (res?.duplicate) toast('Already on that block')
      else if (res?.error) toast.error('Could not add task')
      else toast.success(`Added “${task.title}”`)
    } else if (overId.startsWith('slot-')) {
      // slot-<yyyy-MM-dd>-<hour>
      const rest = overId.slice('slot-'.length)
      const cut = rest.lastIndexOf('-')
      const date = rest.slice(0, cut)
      const hour = parseInt(rest.slice(cut + 1), 10)
      const { error } = await createBlock(user.id, {
        date,
        title: task.title,
        start_time: `${String(hour).padStart(2, '0')}:00`,
        end_time: `${String(hour + 1).padStart(2, '0')}:00`,
        color: '#ff9b73',
        task_ids: [task.id],
        task_names: [task.title],
        focus_type: 'Other',
      })
      if (error) { toast.error('Could not create block'); return }
      // Dropping onto an hour that's already busy is allowed, but say so.
      const clashes = findConflicts(
        blocks.filter(b => b.date === date),
        { start: hour * 60, end: (hour + 1) * 60 }
      )
      if (clashes.length) toast(`Blocked ${String(hour).padStart(2, '0')}:00 — overlaps “${clashes[0].title}”`, { icon: '⚠️' })
      else toast.success(`Blocked ${String(hour).padStart(2, '0')}:00 for “${task.title}”`)
    }
  }

  const handlers = {
    onEdit: block => { setFormBlock(block); setFormOpen(true) },
    onFocusNow: handleFocusNow,
    onResize: async (blk, start_time, end_time) => {
      const { error } = await updateBlock(blk.id, { start_time, end_time })
      if (error) { toast.error('Could not resize block'); return }
      const clashes = findConflicts(
        blocks.filter(b => b.date === blk.date),
        { start: timeToMinutes(start_time), end: timeToMinutes(end_time) },
        blk.id
      )
      if (clashes.length) {
        toast(`Now overlaps “${clashes[0].title}”${clashes.length > 1 ? ` +${clashes.length - 1}` : ''}`, { icon: '⚠️' })
      }
    },
    onRemoveTask: handleRemoveTask,
  }

  const rangeLabel = week
    ? `${monthDayShort(dates[0])} – ${monthDayShort(dates[6])}`
    : viewDate === todayStr() ? 'Today'
    : viewDate === tomorrowStr() ? 'Tomorrow'
    : monthDayShort(viewDate)

  function shift(dir) {
    setViewDate(addDaysStr(viewDate, week ? dir * 7 : dir))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="xf-canvas h-screen w-full max-w-full flex flex-col overflow-hidden">

        {/* Header — stacks on mobile, single row from sm up */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-7 py-4 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--line)' }}>
          <div className="min-w-0 flex items-center gap-2">
            <div className="min-w-0">
              <h2 className="font-extrabold" style={{ fontFamily: 'Manrope, sans-serif', fontSize: 18, color: 'var(--ink)' }}>Time Blocks</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs" style={{ color: 'var(--ink-3)' }}>{rangeLabel}</p>
                {clashCount > 0 && (
                  <span
                    className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(255,155,115,0.14)', color: 'var(--coral-deep)' }}
                    title="Blocks are scheduled on top of each other"
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: 11 }}>warning</span>
                    {clashCount} overlapping
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-0.5 ml-1">
              <NavBtn icon="chevron_left" onClick={() => shift(-1)} title={week ? 'Previous week' : 'Previous day'} />
              <NavBtn icon="today" onClick={() => setViewDate(todayStr())} title="Jump to today" />
              <NavBtn icon="chevron_right" onClick={() => shift(1)} title={week ? 'Next week' : 'Next day'} />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            {/* Day / Week switch */}
            <div className="flex rounded-xl p-1 gap-1" style={{ background: 'var(--canvas)' }}>
              {[{ label: 'Day', val: 'day' }, { label: 'Week', val: 'week' }].map(({ label, val }) => (
                <button key={val} onClick={() => setViewMode(val)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                  style={viewMode === val ? { background: 'linear-gradient(150deg, var(--coral), var(--peach))', color: '#fff' } : { color: 'var(--ink-3)' }}
                >
                  {label}
                </button>
              ))}
            </div>

            {!week && (
              <div className="flex rounded-xl p-1 gap-1" style={{ background: 'var(--canvas)' }}>
                {[{ label: 'Today', val: todayStr() }, { label: 'Tomorrow', val: tomorrowStr() }].map(({ label, val }) => (
                  <button key={val} onClick={() => setViewDate(val)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={viewDate === val ? { background: 'var(--surface)', color: 'var(--ink)', boxShadow: 'var(--shadow-sm)' } : { color: 'var(--ink-3)' }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setPlannerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-sm transition-all active:scale-95 flex-shrink-0"
              style={{ background: 'var(--surface)', color: 'var(--lav-deep)', boxShadow: 'var(--shadow-sm)' }}
              title="Suggest a schedule from your open tasks"
            >
              <span className="material-symbols-rounded" style={{ fontSize: 16 }}>auto_awesome</span>
              <span className="hidden sm:inline">Plan my day</span>
            </button>

            {/* Mobile: open task drawer */}
            <button
              onClick={() => setPanelOpen(true)}
              className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-sm)', color: 'var(--lav-deep)' }}
              title="Pulse tasks"
            >
              <span className="material-symbols-rounded" style={{ fontSize: 19 }}>task_alt</span>
            </button>
            <button
              onClick={() => { setFormBlock({}); setFormOpen(true) }}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl font-bold text-sm text-white transition-all active:scale-95 flex-shrink-0"
              style={{ background: 'linear-gradient(150deg, var(--coral), var(--coral-deep))', boxShadow: 'var(--shadow-coral)' }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 16 }}>add</span>
              <span className="hidden sm:inline">New Block</span>
            </button>
          </div>
        </div>

        {/* Main area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Timeline */}
          <div className="flex-1 overflow-auto pb-20 sm:pb-0" ref={timelineRef}>
            <div className="mx-auto" style={{ maxWidth: week ? 1100 : 720, minWidth: week ? 700 : undefined }}>

              {/* Week: sticky weekday header row */}
              {week && (
                <div className="flex sticky top-0 z-30 pt-2" style={{ background: 'var(--canvas)' }}>
                  <div style={{ width: 44, flexShrink: 0 }} />
                  {dates.map(d => {
                    const isToday = d === todayStr()
                    return (
                      <button
                        key={d}
                        onClick={() => { setViewMode('day'); setViewDate(d) }}
                        className="flex-1 min-w-0 pb-2 text-center transition-colors"
                        title="Open this day"
                      >
                        <p className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: isToday ? 'var(--coral-deep)' : 'var(--ink-4)' }}>
                          {weekdayShort(d)}
                        </p>
                        <p className="text-xs font-bold" style={{ color: isToday ? 'var(--coral-deep)' : 'var(--ink-2)' }}>
                          {parseDateStr(d).getDate()}
                        </p>
                      </button>
                    )
                  })}
                </div>
              )}

              <div className="flex" style={{ minHeight: timelineHeight + 64 }}>
                {/* Hour labels */}
                <div className="flex-shrink-0 select-none" style={{ width: week ? 44 : 56, paddingTop: 8, paddingBottom: 32 }}>
                  {HOURS.map(h => (
                    <div key={h} className="flex items-start justify-end pr-2" style={{ height: 60 * pxPerMin }}>
                      <span className="text-[10px] font-bold tabular-nums" style={{ color: 'var(--ink-4)', marginTop: -6 }}>
                        {hourLabel(h)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* One column per visible day */}
                <div className="flex flex-1 min-w-0" style={{ paddingTop: 8, paddingBottom: 32 }}>
                  {dates.map(d => (
                    <div
                      key={d}
                      className="flex-1 min-w-0 relative"
                      style={week ? { borderLeft: '1px solid var(--line)' } : undefined}
                    >
                      <DayColumn
                        date={d}
                        blocks={byDate.get(d) || []}
                        pxPerMin={pxPerMin}
                        dense={week}
                        taskMap={taskMap}
                        handlers={handlers}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Pulse panel — docked on desktop */}
          <div className="hidden md:flex">
            <PulseTaskPanel userId={user.id} />
          </div>
        </div>
      </div>

      {/* Pulse panel — drawer on mobile */}
      {panelOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex justify-end" onClick={() => setPanelOpen(false)} style={{ background: 'rgba(43,47,68,0.35)' }}>
          <div className="h-full" onClick={e => e.stopPropagation()}>
            <PulseTaskPanel userId={user.id} onClose={() => setPanelOpen(false)} />
          </div>
        </div>
      )}

      {/* Drag overlay */}
      <DragOverlay>
        {activeDrag && (
          <div className="px-3 py-2 rounded-xl text-xs font-bold text-white" style={{ background: 'var(--coral)', maxWidth: 200, transform: 'rotate(2deg)', boxShadow: 'var(--shadow)' }}>
            {activeDrag.title}
          </div>
        )}
      </DragOverlay>

      {formOpen && (
        <BlockForm user={user} initial={formBlock} onClose={() => { setFormOpen(false); setFormBlock(null) }} />
      )}

      {plannerOpen && (
        <DayPlanner
          user={user}
          date={week ? todayStr() : viewDate}
          blocks={blocks}
          onClose={() => setPlannerOpen(false)}
        />
      )}
    </DndContext>
  )
}

function NavBtn({ icon, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
      style={{ color: 'var(--ink-3)' }}
    >
      <span className="material-symbols-rounded" style={{ fontSize: 17 }}>{icon}</span>
    </button>
  )
}
