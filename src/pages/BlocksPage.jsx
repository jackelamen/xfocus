import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, useDroppable, pointerWithin } from '@dnd-kit/core'
import { useBlocksStore } from '../store/blocksStore.js'
import { useTimerStore } from '../store/timerStore.js'
import { usePulseTasks } from '../hooks/usePulseTasks.js'
import PulseTaskPanel from '../components/blocks/PulseTaskPanel.jsx'
import BlockForm from '../components/blocks/BlockForm.jsx'
import { todayStr, tomorrowStr, timeToMinutes, minutesToTime } from '../lib/utils.js'

const PX_PER_MIN = 1.4
const HOUR_START = 6
const HOUR_END = 23
const TOTAL_MINS = (HOUR_END - HOUR_START) * 60
const TIMELINE_HEIGHT = TOTAL_MINS * PX_PER_MIN
const SNAP_MIN = 5          // snap resize to 5-minute steps
const MIN_BLOCK_MIN = 15    // a block can't be shorter than 15 minutes

function minsToPx(mins) { return (mins - HOUR_START * 60) * PX_PER_MIN }
function snap(mins) { return Math.round(mins / SNAP_MIN) * SNAP_MIN }

function TimeBlock({ block, onEdit, onFocusNow, onResize }) {
  const { setNodeRef } = useDroppable({ id: `block-${block.id}` })

  // Live draft while resizing (null when not resizing)
  const [draft, setDraft] = useState(null)
  const resizeRef = useRef(null)

  const startMin = draft ? draft.start : timeToMinutes(block.start_time)
  const endMin = draft ? draft.end : timeToMinutes(block.end_time)
  const top = minsToPx(startMin)
  const height = Math.max(28, (endMin - startMin) * PX_PER_MIN)
  const resizing = !!draft

  function beginResize(edge, e) {
    e.preventDefault()
    e.stopPropagation()
    const startY = e.clientY
    const origStart = timeToMinutes(block.start_time)
    const origEnd = timeToMinutes(block.end_time)
    resizeRef.current = { edge, startY, origStart, origEnd }
    setDraft({ start: origStart, end: origEnd })
    try { e.target.setPointerCapture(e.pointerId) } catch (_) {}

    const onMove = (ev) => {
      const r = resizeRef.current
      if (!r) return
      const deltaMin = snap((ev.clientY - r.startY) / PX_PER_MIN)
      if (r.edge === 'top') {
        const newStart = Math.min(r.origEnd - MIN_BLOCK_MIN, Math.max(HOUR_START * 60, r.origStart + deltaMin))
        setDraft({ start: newStart, end: r.origEnd })
      } else {
        const newEnd = Math.max(r.origStart + MIN_BLOCK_MIN, Math.min(HOUR_END * 60, r.origEnd + deltaMin))
        setDraft({ start: r.origStart, end: newEnd })
      }
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      const r = resizeRef.current
      resizeRef.current = null
      setDraft(cur => {
        if (cur && r) {
          const changed = cur.start !== r.origStart || cur.end !== r.origEnd
          if (changed) onResize(block, minutesToTime(cur.start), minutesToTime(cur.end))
        }
        return null
      })
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const handleStyle = (pos) => ({
    position: 'absolute', left: 0, right: 0, height: 9, [pos]: -2,
    cursor: 'ns-resize', zIndex: 6, touchAction: 'none',
  })

  return (
    <div
      ref={setNodeRef}
      className="absolute left-0 right-2 rounded-xl overflow-hidden group"
      style={{
        top, height, background: block.color + '20',
        border: `1.5px solid ${block.color}${resizing ? '99' : '55'}`,
        zIndex: resizing ? 15 : 5,
        boxShadow: resizing ? '0 6px 18px rgba(91,110,160,0.22)' : 'none',
      }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ background: block.color }} />

      {/* Resize handles (top + bottom). Visible on hover/resize. */}
      <div onPointerDown={e => beginResize('top', e)} style={handleStyle('top')} className="opacity-0 group-hover:opacity-100" title="Drag to change start">
        <div className="mx-auto mt-[3px] rounded-full" style={{ width: 26, height: 3, background: block.color, opacity: 0.7 }} />
      </div>
      <div onPointerDown={e => beginResize('bottom', e)} style={handleStyle('bottom')} className="opacity-0 group-hover:opacity-100" title="Drag to change end">
        <div className="mx-auto mt-[3px] rounded-full" style={{ width: 26, height: 3, background: block.color, opacity: 0.7 }} />
      </div>

      <div className="pl-3 pr-2 py-1.5 h-full flex flex-col justify-between">
        <div className="flex items-start justify-between gap-1">
          <div className="flex-1 min-w-0">
            <p className="font-bold leading-tight truncate" style={{ color: block.color, fontSize: height < 36 ? 9 : 11 }}>
              {block.title}
            </p>
            {height > 40 && block.task_names?.length > 0 && (
              <p className="text-[9px] truncate mt-0.5" style={{ color: 'var(--ink-2)' }}>
                {block.task_names.join(', ')}
              </p>
            )}
          </div>
          {!resizing && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button
                onClick={e => { e.stopPropagation(); onFocusNow(block) }}
                className="w-5 h-5 rounded flex items-center justify-center text-white"
                style={{ background: block.color }}
                title="Focus now"
              >
                <span className="material-symbols-rounded" style={{ fontSize: 11 }}>play_arrow</span>
              </button>
              <button
                onClick={e => { e.stopPropagation(); onEdit(block) }}
                className="w-5 h-5 rounded flex items-center justify-center"
                style={{ color: 'var(--ink-3)' }}
                title="Edit"
              >
                <span className="material-symbols-rounded" style={{ fontSize: 11 }}>edit</span>
              </button>
            </div>
          )}
        </div>
        {(height > 55 || resizing) && (
          <p className="text-[9px] font-bold" style={{ color: resizing ? block.color : 'var(--ink-3)' }}>
            {minutesToTime(startMin)} – {minutesToTime(endMin)}
          </p>
        )}
        {block.completed && !resizing && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(244,247,252,0.6)' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 20, color: 'var(--sky-deep)' }}>check_circle</span>
          </div>
        )}
      </div>
    </div>
  )
}

function EmptySlotDroppable({ hour }) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${hour}` })
  return (
    <div
      ref={setNodeRef}
      className="absolute left-0 right-0 transition-colors"
      style={{
        top: minsToPx(hour * 60),
        height: 60 * PX_PER_MIN,
        background: isOver ? 'rgba(255,155,115,0.10)' : 'transparent',
        border: isOver ? '1px dashed var(--coral)' : '1px dashed transparent',
        borderRadius: 8,
        zIndex: 1,
      }}
    />
  )
}

function NowLine() {
  const [top, setTop] = useState(null)
  useEffect(() => {
    function update() {
      const now = new Date()
      const mins = now.getHours() * 60 + now.getMinutes()
      if (mins >= HOUR_START * 60 && mins <= HOUR_END * 60) setTop(minsToPx(mins))
      else setTop(null)
    }
    update()
    const id = setInterval(update, 60000)
    return () => clearInterval(id)
  }, [])
  if (top === null) return null
  return (
    <div className="absolute left-0 right-0 flex items-center pointer-events-none" style={{ top, zIndex: 20 }}>
      <div className="w-2 h-2 rounded-full flex-shrink-0 -ml-1" style={{ background: 'var(--coral-deep)' }} />
      <div className="flex-1 h-px" style={{ background: 'var(--coral-deep)', opacity: 0.6 }} />
    </div>
  )
}

export default function BlocksPage({ user }) {
  const navigate = useNavigate()
  const { blocks, viewDate, setViewDate, loadBlocks, addTaskToBlock, createBlock, updateBlock } = useBlocksStore()
  const setActiveBlock = useTimerStore(s => s.setActiveBlock)
  usePulseTasks(user.id)

  const [formBlock, setFormBlock] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [activeDrag, setActiveDrag] = useState(null)
  const [panelOpen, setPanelOpen] = useState(false)   // mobile drawer
  const timelineRef = useRef(null)

  useEffect(() => { loadBlocks(user.id) }, [user.id, viewDate])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  function handleFocusNow(block) {
    setActiveBlock(block)
    navigate('/focus')
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
      await addTaskToBlock(overId.replace('block-', ''), task.id, task.title)
    } else if (overId.startsWith('slot-')) {
      const hour = parseInt(overId.replace('slot-', ''))
      await createBlock(user.id, {
        title: task.title,
        start_time: `${String(hour).padStart(2,'0')}:00`,
        end_time: `${String(hour + 1).padStart(2,'0')}:00`,
        color: '#ff9b73',
        task_ids: [task.id],
        task_names: [task.title],
        focus_type: 'Other',
      })
    }
  }

  const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i)

  return (
    <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="xf-canvas h-screen w-full max-w-full flex flex-col overflow-hidden">

        {/* Header — stacks on mobile, single row from sm up */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-7 py-4 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--line)' }}>
          <div className="min-w-0">
            <h2 className="font-extrabold" style={{ fontFamily: 'Manrope, sans-serif', fontSize: 18, color: 'var(--ink)' }}>Time Blocks</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--ink-3)' }}>
              {viewDate === todayStr() ? 'Today' : viewDate === tomorrowStr() ? 'Tomorrow' : viewDate}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex rounded-xl p-1 gap-1 flex-1 sm:flex-initial" style={{ background: 'var(--canvas)' }}>
              {[{ label: 'Today', val: todayStr() }, { label: 'Tomorrow', val: tomorrowStr() }].map(({ label, val }) => (
                <button key={val} onClick={() => setViewDate(val)}
                  className="flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
                  style={viewDate === val ? { background: 'linear-gradient(150deg, var(--coral), var(--peach))', color: '#fff' } : { color: 'var(--ink-3)' }}
                >
                  {label}
                </button>
              ))}
            </div>
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
          <div className="flex-1 overflow-y-auto pb-20 sm:pb-0" ref={timelineRef}>
            <div className="flex mx-auto" style={{ minHeight: TIMELINE_HEIGHT + 64, maxWidth: 720 }}>
              {/* Hour labels */}
              <div className="flex-shrink-0 select-none" style={{ width: 56, paddingTop: 8, paddingBottom: 32 }}>
                {hours.map(h => (
                  <div key={h} className="flex items-start justify-end pr-3" style={{ height: 60 * PX_PER_MIN }}>
                    <span className="text-[10px] font-bold tabular-nums" style={{ color: 'var(--ink-4)', marginTop: -6 }}>
                      {h === 12 ? '12p' : h > 12 ? `${h - 12}p` : `${h}a`}
                    </span>
                  </div>
                ))}
              </div>
              {/* Blocks + grid */}
              <div className="flex-1 relative" style={{ paddingRight: 16, paddingTop: 8, paddingBottom: 32, height: TIMELINE_HEIGHT + 40 }}>
                {hours.map(h => (
                  <div key={h} className="absolute left-0 right-4 pointer-events-none" style={{ top: minsToPx(h * 60), height: 1, background: 'var(--line)' }} />
                ))}
                {hours.map(h => <EmptySlotDroppable key={h} hour={h} />)}
                {blocks.map(b => (
                  <TimeBlock
                    key={b.id}
                    block={b}
                    onEdit={block => { setFormBlock(block); setFormOpen(true) }}
                    onFocusNow={handleFocusNow}
                    onResize={(blk, start_time, end_time) => updateBlock(blk.id, { start_time, end_time })}
                  />
                ))}
                {viewDate === todayStr() && <NowLine />}
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
    </DndContext>
  )
}
