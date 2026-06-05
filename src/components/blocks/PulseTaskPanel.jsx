import React, { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { usePulseTasks } from '../../hooks/usePulseTasks.js'

function DraggableTask({ task }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `task-${task.id}`,
    data: { type: 'task', task },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-grab active:cursor-grabbing select-none transition-all"
      style={{
        background: isDragging ? 'rgba(249,115,22,0.12)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${isDragging ? 'rgba(249,115,22,0.3)' : 'rgba(255,255,255,0.06)'}`,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <span className="material-symbols-rounded text-white/20" style={{ fontSize: 14 }}>drag_indicator</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-white/80 truncate">{task.title}</p>
        {task.due_date && (
          <p className="text-[10px] text-white/30 mt-0.5">{task.due_date}</p>
        )}
      </div>
      {task.priority && task.priority !== 'none' && (
        <span className="text-[10px] font-black px-1.5 py-0.5 rounded" style={{
          background: task.priority === 'urgent' ? 'rgba(239,68,68,0.15)' : 'rgba(249,115,22,0.1)',
          color: task.priority === 'urgent' ? '#ef4444' : '#f97316',
        }}>
          {task.priority[0].toUpperCase()}
        </span>
      )}
    </div>
  )
}

export default function PulseTaskPanel({ userId }) {
  const { tasks, loading, error, refresh } = usePulseTasks(userId)
  const [search, setSearch] = useState('')

  const filtered = tasks.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div
      className="w-72 flex-shrink-0 flex flex-col overflow-hidden"
      style={{ background: '#0f0f1a', borderLeft: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Header */}
      <div className="px-4 py-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.2)' }}>
            <span className="material-symbols-rounded text-purple-400" style={{ fontSize: 13 }}>task_alt</span>
          </div>
          <span className="text-sm font-bold text-white/80">Pulse Tasks</span>
          <button
            onClick={refresh}
            disabled={loading}
            className="ml-auto p-1.5 rounded-lg transition-all hover:bg-white/10"
            title="Refresh"
          >
            <span
              className={`material-symbols-rounded text-white/30 ${loading ? 'animate-spin' : ''}`}
              style={{ fontSize: 14 }}
            >refresh</span>
          </button>
        </div>
        <div className="relative">
          <span className="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-white/20" style={{ fontSize: 14 }}>search</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks…"
            className="w-full pl-8 pr-3 py-2 rounded-xl text-xs font-medium text-white placeholder-white/25 outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.07)' }}
          />
        </div>
        {error && (
          <p className="text-[10px] text-red-400/60 mt-2">Pulse tables not found. Tasks will be empty until Pulse is set up.</p>
        )}
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-5 h-5 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10">
            <span className="material-symbols-rounded text-white/15 text-3xl block mb-2">inbox</span>
            <p className="text-xs text-white/25">{search ? 'No matches' : 'No open tasks'}</p>
          </div>
        ) : (
          filtered.map(t => <DraggableTask key={t.id} task={t} />)
        )}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
        <p className="text-[10px] text-white/20">
          <span className="material-symbols-rounded" style={{ fontSize: 11, verticalAlign: '-1px' }}>drag_indicator</span>
          {' '}Drag tasks onto a time block
        </p>
      </div>
    </div>
  )
}
