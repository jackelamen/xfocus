import React from 'react'
import { usePulseTasks } from '../../hooks/usePulseTasks.js'
import { useTimerStore } from '../../store/timerStore.js'

export default function TaskSelector({ user, disabled }) {
  const { tasks } = usePulseTasks(user.id)
  const selectedTaskId = useTimerStore(s => s.selectedTaskId)
  const setSelectedTask = useTimerStore(s => s.setSelectedTask)

  return (
    <div className="w-full max-w-md">
      <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-1.5" style={{ color: 'var(--ink-3)' }}>
        Focus task
      </label>
      <select
        value={selectedTaskId || ''}
        disabled={disabled}
        onChange={e => {
          const t = tasks.find(x => x.id === e.target.value)
          setSelectedTask(t || null)
        }}
        className="w-full rounded-xl px-3.5 py-2.5 text-sm font-medium outline-none disabled:opacity-60"
        style={{ background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--line-2)' }}
      >
        <option value="">Free-form focus session</option>
        {tasks.map(t => (
          <option key={t.id} value={t.id}>
            {t.title}{t.priority === 'urgent' ? '  ·  urgent' : ''}
          </option>
        ))}
      </select>
    </div>
  )
}
