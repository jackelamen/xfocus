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
      className="rounded-2xl p-4 flex items-center gap-4"
      style={{ background: `${block.color}15`, border: `1px solid ${block.color}30` }}
    >
      <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: block.color }} />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest mb-0.5" style={{ color: `${block.color}90` }}>
          {currentBlock ? 'Now' : 'Up next'}
        </p>
        <p className="text-sm font-bold text-white truncate">{block.title}</p>
        {block.task_names?.length > 0 && (
          <p className="text-xs text-white/40 truncate mt-0.5">{block.task_names.join(', ')}</p>
        )}
        <p className="text-xs text-white/30 mt-0.5">{block.start_time.slice(0,5)} – {block.end_time.slice(0,5)}</p>
      </div>
      <button
        onClick={focusNow}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs text-white flex-shrink-0 transition-all active:scale-95"
        style={{ background: block.color }}
      >
        <span className="material-symbols-rounded" style={{ fontSize: 15 }}>play_arrow</span>
        Focus
      </button>
    </div>
  )
}
