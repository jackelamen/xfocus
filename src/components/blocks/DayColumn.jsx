import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { timeToMinutes, minutesToTime, todayStr } from '../../lib/utils.js'
import { layoutBlocks } from '../../lib/overlap.js'
import { HOUR_START, HOUR_END, TOTAL_MINS, SNAP_MIN, MIN_BLOCK_MIN, HOURS } from '../../lib/timeline.js'
import TaskChip from './TaskChip.jsx'

function TimeBlock({ block, pxPerMin, taskMap, dense, lane, onEdit, onFocusNow, onResize, onRemoveTask }) {
  const { setNodeRef, isOver } = useDroppable({ id: `block-${block.id}` })

  // Live draft while resizing (null when not resizing)
  const [draft, setDraft] = useState(null)
  const resizeRef = useRef(null)

  const startMin = draft ? draft.start : timeToMinutes(block.start_time)
  const endMin = draft ? draft.end : timeToMinutes(block.end_time)
  const top = (startMin - HOUR_START * 60) * pxPerMin
  const height = Math.max(28, (endMin - startMin) * pxPerMin)
  const resizing = !!draft

  // Clashing blocks share the column: each takes 1/lanes of the width. A small
  // stagger keeps the underlying block's edge visible.
  const lanes = lane?.lanes || 1
  const laneIdx = lane?.lane || 0
  const clashing = lanes > 1
  const widthPct = 100 / lanes
  const gutter = dense ? 1 : 8

  const ids = block.task_ids || []
  const names = block.task_names || []
  // Header (title + time) eats ~34px; each chip needs ~19px.
  const chipRoom = Math.max(0, Math.floor((height - (dense ? 22 : 34)) / (dense ? 17 : 19)))
  const visibleChips = resizing ? 0 : Math.min(ids.length, chipRoom)
  const hiddenChips = ids.length - visibleChips

  function beginResize(edge, e) {
    e.preventDefault()
    e.stopPropagation()
    const startY = e.clientY
    const origStart = timeToMinutes(block.start_time)
    const origEnd = timeToMinutes(block.end_time)
    resizeRef.current = { edge, startY, origStart, origEnd }
    setDraft({ start: origStart, end: origEnd })
    try { e.target.setPointerCapture(e.pointerId) } catch (_) {}

    const snap = m => Math.round(m / SNAP_MIN) * SNAP_MIN
    const onMove = (ev) => {
      const r = resizeRef.current
      if (!r) return
      const deltaMin = snap((ev.clientY - r.startY) / pxPerMin)
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
      className="absolute rounded-xl overflow-hidden group"
      style={{
        top, height,
        left: `calc(${laneIdx * widthPct}% + ${laneIdx ? 4 : 0}px)`,
        width: `calc(${widthPct}% - ${gutter}px)`,
        background: block.color + (isOver ? '33' : '20'),
        border: `1.5px solid ${block.color}${resizing || isOver ? '99' : '55'}`,
        zIndex: resizing ? 15 : 5 + laneIdx,
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

      <div className={`${dense ? 'pl-1.5 pr-1' : 'pl-3 pr-2'} py-1 h-full flex flex-col`}>
        <div className="flex items-start justify-between gap-1 flex-shrink-0">
          <p className="font-bold leading-tight truncate flex-1 min-w-0 flex items-center gap-0.5" style={{ color: block.color, fontSize: height < 36 || dense ? 9 : 11 }}>
            {clashing && (
              <span
                className="material-symbols-rounded flex-shrink-0"
                style={{ fontSize: dense ? 10 : 12, color: 'var(--coral-deep)' }}
                title="This block overlaps another"
              >
                warning
              </span>
            )}
            <span className="truncate">{block.title}</span>
          </p>
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

        {/* Task chips — complete, open in Pulse, or detach without leaving the timeline */}
        {visibleChips > 0 && (
          <div className="mt-0.5 space-y-px overflow-hidden">
            {ids.slice(0, visibleChips).map((id, i) => (
              <TaskChip
                key={`${id}-${i}`}
                task={taskMap.get(id)}
                fallbackName={names[i]}
                compact={dense}
                onRemove={() => onRemoveTask(block, id)}
              />
            ))}
            {hiddenChips > 0 && (
              <p className="text-[8px] pl-1" style={{ color: 'var(--ink-4)' }}>+{hiddenChips} more</p>
            )}
          </div>
        )}

        {(height > 55 || resizing) && (
          <p className="text-[9px] font-bold mt-auto flex-shrink-0" style={{ color: resizing ? block.color : 'var(--ink-3)' }}>
            {minutesToTime(startMin)} – {minutesToTime(endMin)}
          </p>
        )}
        {block.completed && !resizing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ background: 'rgba(244,247,252,0.55)' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 20, color: 'var(--sky-deep)' }}>check_circle</span>
          </div>
        )}
      </div>
    </div>
  )
}

function EmptySlotDroppable({ date, hour, pxPerMin }) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${date}-${hour}` })
  return (
    <div
      ref={setNodeRef}
      className="absolute left-0 right-0 transition-colors"
      style={{
        top: (hour * 60 - HOUR_START * 60) * pxPerMin,
        height: 60 * pxPerMin,
        background: isOver ? 'rgba(255,155,115,0.10)' : 'transparent',
        border: isOver ? '1px dashed var(--coral)' : '1px dashed transparent',
        borderRadius: 8,
        zIndex: 1,
      }}
    />
  )
}

function NowLine({ pxPerMin }) {
  const [top, setTop] = useState(null)
  useEffect(() => {
    function update() {
      const now = new Date()
      const mins = now.getHours() * 60 + now.getMinutes()
      if (mins >= HOUR_START * 60 && mins <= HOUR_END * 60) setTop((mins - HOUR_START * 60) * pxPerMin)
      else setTop(null)
    }
    update()
    const id = setInterval(update, 60000)
    return () => clearInterval(id)
  }, [pxPerMin])
  if (top === null) return null
  return (
    <div className="absolute left-0 right-0 flex items-center pointer-events-none" style={{ top, zIndex: 20 }}>
      <div className="w-2 h-2 rounded-full flex-shrink-0 -ml-1" style={{ background: 'var(--coral-deep)' }} />
      <div className="flex-1 h-px" style={{ background: 'var(--coral-deep)', opacity: 0.6 }} />
    </div>
  )
}

/**
 * One day's worth of timeline: hour grid, drop slots, blocks and the now line.
 * Used once in the day view and seven times side by side in the week view.
 */
export default function DayColumn({ date, blocks, pxPerMin, dense = false, taskMap, handlers }) {
  // Overlapping blocks are laid out side by side rather than stacked.
  const lanes = useMemo(() => layoutBlocks(blocks), [blocks])

  return (
    <div
      className="flex-1 relative min-w-0"
      style={{ height: TOTAL_MINS * pxPerMin + 40, paddingRight: dense ? 2 : 16 }}
    >
      {HOURS.map(h => (
        <div key={h} className="absolute left-0 right-0 pointer-events-none"
          style={{ top: (h * 60 - HOUR_START * 60) * pxPerMin, height: 1, background: 'var(--line)' }} />
      ))}
      {HOURS.map(h => <EmptySlotDroppable key={h} date={date} hour={h} pxPerMin={pxPerMin} />)}
      {blocks.map(b => (
        <TimeBlock
          key={b.id}
          block={b}
          pxPerMin={pxPerMin}
          dense={dense}
          lane={lanes.get(b.id)}
          taskMap={taskMap}
          onEdit={handlers.onEdit}
          onFocusNow={handlers.onFocusNow}
          onResize={handlers.onResize}
          onRemoveTask={handlers.onRemoveTask}
        />
      ))}
      {date === todayStr() && <NowLine pxPerMin={pxPerMin} />}
    </div>
  )
}
