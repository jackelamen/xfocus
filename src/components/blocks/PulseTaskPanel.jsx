import React, { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { usePulseTasks } from '../../hooks/usePulseTasks.js'

function DraggableTask({ task }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `task-${task.id}`,
    data: { type: 'task', task },
  })

  const isUrgent = task.priority === 'urgent'

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-grab active:cursor-grabbing select-none transition-all"
      style={{
        background: isDragging ? 'rgba(255,155,115,0.12)' : 'var(--surface)',
        boxShadow: 'var(--shadow-sm)',
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <span className="material-symbols-rounded" style={{ fontSize: 14, color: 'var(--ink-4)' }}>drag_indicator</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate" style={{ color: 'var(--ink)' }}>{task.title}</p>
        {task.due_date && (
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--ink-3)' }}>{task.due_date}</p>
        )}
      </div>
      {task.priority && task.priority !== 'none' && (
        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded" style={{
          background: isUrgent ? 'rgba(255,155,115,0.16)' : 'rgba(155,143,224,0.14)',
          color: isUrgent ? 'var(--coral-deep)' : 'var(--lav-deep)',
        }}>
          {task.priority[0].toUpperCase()}
        </span>
      )}
    </div>
  )
}

export default function PulseTaskPanel({ userId, onClose }) {
  const { tasks, loading, error, refresh } = usePulseTasks(userId)
  const [search, setSearch] = useState('')

  const filtered = tasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div
      className="w-72 flex-shrink-0 flex flex-col overflow-hidden h-full"
      style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', borderLeft: '1px solid var(--line)' }}
    >
      {/* Header */}
      <div className="px-4 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--line)' }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(155,143,224,0.16)' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 13, color: 'var(--lav-deep)' }}>task_alt</span>
          </div>
          <span className="text-sm font-bold" style={{ color: 'var(--ink)' }}>Pulse Tasks</span>
          <button
            onClick={refresh}
            disabled={loading}
            className="ml-auto p-1.5 rounded-lg transition-all"
            style={{ color: 'var(--ink-3)' }}
            title="Refresh"
          >
            <span className={`material-symbols-rounded ${loading ? 'animate-spin' : ''}`} style={{ fontSize: 14 }}>refresh</span>
          </button>
          {onClose && (
            <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: 'var(--ink-3)' }} title="Close">
              <span className="material-symbols-rounded" style={{ fontSize: 16 }}>close</span>
            </button>
          )}
        </div>
        <div className="relative">
          <span className="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2" style={{ fontSize: 14, color: 'var(--ink-4)' }}>search</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks…"
            className="w-full pl-8 pr-3 py-2 rounded-xl text-xs font-medium outline-none"
            style={{ background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--line-2)' }}
          />
        </div>
        {error && (
          <p className="text-[10px] mt-2" style={{ color: 'var(--ink-3)' }}>Pulse tasks unavailable. Check your connection or login.</p>
        )}
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--coral)', borderTopColor: 'transparent' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10">
            <span className="material-symbols-rounded text-3xl block mb-2" style={{ color: 'var(--ink-4)' }}>inbox</span>
            <p className="text-xs" style={{ color: 'var(--ink-3)' }}>{search ? 'No matches' : 'No open tasks'}</p>
          </div>
        ) : (
          filtered.map(t => <DraggableTask key={t.id} task={t} />)
        )}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: '1px solid var(--line)' }}>
        <p className="text-[10px]" style={{ color: 'var(--ink-3)' }}>
          <span className="material-symbols-rounded" style={{ fontSize: 11, verticalAlign: '-1px' }}>drag_indicator</span>
          {' '}Drag tasks onto a time block
        </p>
      </div>
    </div>
  )
}
