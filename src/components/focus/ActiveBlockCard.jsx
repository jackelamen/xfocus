import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useBlocksStore } from '../../store/blocksStore.js'
import { useTimerStore } from '../../store/timerStore.js'
import { todayStr, timeToMinutes } from '../../lib/utils.js'

function getCurrentBlock(blocks) {
  const now = new Date()
  const currentMins = now.getHours() * 60 + now.getMinutes()
  return blocks.find(b => {
    const start = timeToMinutes(b.start_time)
    const end = timeToMinutes(b.end_time)
    return !b.completed && currentMins >= start && currentMins <= end
  })
}

function getNextBlock(blocks) {
  const now = new Date()
  const currentMins = now.getHours() * 60 + now.getMinutes()
  return blocks
    .filter(b => !b.completed && timeToMinutes(b.start_time) > currentMins)
    .sort((a, b) => a.start_time.localeCompare(b.start_time))[0]
}

export default function ActiveBlockCard() {
  const blocks = useBlocksStore(s => s.blocks)
  const viewDate = useBlocksStore(s => s.viewDate)
  const setActiveBlock = useTimerStore(s => s.setActiveBlock)
  const navigate = useNavigate()

  const isToday = viewDate === todayStr()
  const currentBlock = isToday ? getCurrentBlock(blocks) : null
  const nextBlock = isToday && !currentBlock ? getNextBlock(blocks) : null

  const block = currentBlock || nextBlock
  if (!block) return null

  function focusNow() {
    setActiveBlock(block)
  }

  return (
    <div
      className="rounded-[18px] p-[13px] flex items-center gap-3 mb-6"
      style={{ background: 'linear-gradient(120deg, rgba(169,212,245,0.32), rgba(207,198,243,0.28))' }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-sm)', color: 'var(--sky-deep)' }}
      >
        <span className="material-symbols-rounded" style={{ fontSize: 19 }}>calendar_view_day</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] mb-0.5" style={{ color: 'var(--sky-deep)' }}>
          {currentBlock ? 'Now' : 'Up next'}
        </p>
        <p className="text-sm font-bold truncate" style={{ color: 'var(--ink)' }}>{block.title}</p>
        {block.task_names?.length > 0 && (
          <p className="text-xs truncate mt-0.5" style={{ color: 'var(--ink-2)' }}>{block.task_names.join(', ')}</p>
        )}
        <p className="text-xs mt-0.5" style={{ color: 'var(--ink-3)' }}>{block.start_time.slice(0,5)} – {block.end_time.slice(0,5)}</p>
      </div>
      <button
        onClick={focusNow}
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-95"
        style={{ background: 'linear-gradient(150deg, var(--coral), var(--peach))', color: '#fff', boxShadow: '0 6px 14px rgba(255,155,115,0.45)' }}
        title="Focus on this block"
      >
        <span className="material-symbols-rounded" style={{ fontSize: 21 }}>play_arrow</span>
      </button>
    </div>
  )
}
