import React, { useState } from 'react'
import { useFocusStore } from '../../store/focusStore.js'
import { useTimerStore } from '../../store/timerStore.js'
import { todayStr, FOCUS_TYPES } from '../../lib/utils.js'
import toast from 'react-hot-toast'

const STARS = [1, 2, 3, 4, 5]

export default function PostSessionModal({ user, sessionMeta, onClose }) {
  const saveSession = useFocusStore(s => s.saveSession)
  const { activeBlockId, activeBlockTitle, activeTaskNames, selectedTaskId, selectedTaskName } = useTimerStore()

  // Task names = the picked Pulse task (if any) plus any block tasks.
  const taskNames = [selectedTaskName, ...activeTaskNames].filter(Boolean)
  const taskIds = selectedTaskId ? [selectedTaskId] : []

  const [feltScore, setFeltScore] = useState(0)
  const [gotDistracted, setGotDistracted] = useState(null)
  const [distractionCount, setDistractionCount] = useState(0)
  const [taskCompleted, setTaskCompleted] = useState(null)
  const [wouldRepeat, setWouldRepeat] = useState(null)
  const [focusType, setFocusType] = useState('Other')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (feltScore === 0) { toast.error('Please rate your focus level'); return }
    setSaving(true)
    const payload = {
      date: todayStr(),
      started_at: sessionMeta?.startedAt || null,
      ended_at: sessionMeta?.endedAt || new Date().toISOString(),
      duration_mins: sessionMeta?.durationMins || 0,
      mode: sessionMeta?.mode || 'custom',
      task_id: taskIds[0] || null,
      task_ids: taskIds,
      focus_type: focusType,
      task_names: taskNames,
      completed: taskCompleted === 'yes',
      time_block_id: activeBlockId || null,
      notes: notes || null,
      felt_score: feltScore,
      got_distracted: gotDistracted === true,
      distraction_count: gotDistracted ? distractionCount : 0,
      task_completed: taskCompleted,
      would_repeat: wouldRepeat,
    }
    const { error, reward } = await saveSession(user.id, payload)
    setSaving(false)
    if (error) { toast.error('Failed to save session'); return }
    onClose(reward)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(43,47,68,0.45)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-[26px] overflow-hidden" style={{ background: 'var(--surface)', boxShadow: '0 30px 70px rgba(70,90,140,0.35)' }}>

        {/* Header */}
        <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg, var(--coral), var(--peach))' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="material-symbols-rounded text-white/70 text-sm">psychology</span>
                <span className="text-xs font-black uppercase tracking-widest text-white/70">Session Complete</span>
              </div>
              <h3 className="text-xl font-black text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                How'd it go?
              </h3>
              {activeBlockTitle && (
                <p className="text-white/70 text-xs mt-0.5">{activeBlockTitle}</p>
              )}
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center transition-all" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <span className="material-symbols-rounded text-white text-base">close</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">

          {/* Focus quality */}
          <div>
            <label className="block text-xs font-black uppercase tracking-widest mb-3" style={{ color: 'var(--ink-3)' }}>
              How focused did you feel?
            </label>
            <div className="flex gap-2">
              {STARS.map(n => (
                <button
                  key={n}
                  onClick={() => setFeltScore(n)}
                  className="flex-1 py-2.5 rounded-xl font-black text-sm transition-all"
                  style={
                    feltScore >= n
                      ? { background: 'rgba(255,155,115,0.16)', color: 'var(--coral-deep)', border: '1.5px solid var(--coral)' }
                      : { background: 'var(--canvas)', color: 'var(--ink-4)', border: '1.5px solid transparent' }
                  }
                >
                  {['😔', '😐', '🙂', '😊', '🔥'][n - 1]}
                </button>
              ))}
            </div>
            <div className="flex justify-between mt-1 px-1">
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>Distracted</span>
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>Peak flow</span>
            </div>
          </div>

          {/* Distracted? */}
          <div>
            <label className="block text-xs font-black uppercase tracking-widest mb-3" style={{ color: 'var(--ink-3)' }}>
              Did you get distracted?
            </label>
            <div className="flex gap-2">
              {[{ v: false, label: 'No — solid focus' }, { v: true, label: 'Yes' }].map(({ v, label }) => (
                <button
                  key={String(v)}
                  onClick={() => setGotDistracted(v)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all"
                  style={
                    gotDistracted === v
                      ? (v
                          ? { background: 'rgba(155,143,224,0.15)', color: 'var(--lav-deep)', border: '1.5px solid var(--lav-deep)' }
                          : { background: 'rgba(90,168,230,0.15)', color: 'var(--sky-deep)', border: '1.5px solid var(--sky-deep)' })
                      : { background: 'var(--canvas)', color: 'var(--ink-3)', border: '1.5px solid transparent' }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
            {gotDistracted && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs" style={{ color: 'var(--ink-3)' }}>How many times?</span>
                <input
                  type="number" min="1" max="20"
                  value={distractionCount}
                  onChange={e => setDistractionCount(parseInt(e.target.value) || 0)}
                  className="w-16 rounded-lg px-3 py-1.5 text-sm text-center font-bold"
                  style={{ background: 'var(--canvas)', color: 'var(--ink)', border: '1px solid var(--line-2)' }}
                />
              </div>
            )}
          </div>

          {/* Task completed? */}
          <div>
            <label className="block text-xs font-black uppercase tracking-widest mb-3" style={{ color: 'var(--ink-3)' }}>
              Did you complete the task?
            </label>
            <div className="flex gap-2">
              {[{ v: 'yes', label: '✓ Yes' }, { v: 'partial', label: '◑ Partial' }, { v: 'no', label: '✗ No' }].map(({ v, label }) => (
                <button
                  key={v}
                  onClick={() => setTaskCompleted(v)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all"
                  style={
                    taskCompleted === v
                      ? { background: 'rgba(255,155,115,0.16)', color: 'var(--coral-deep)', border: '1.5px solid var(--coral)' }
                      : { background: 'var(--canvas)', color: 'var(--ink-3)', border: '1.5px solid transparent' }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Would repeat? */}
          <div>
            <label className="block text-xs font-black uppercase tracking-widest mb-3" style={{ color: 'var(--ink-3)' }}>
              Would you repeat this block?
            </label>
            <div className="flex gap-2">
              {[{ v: true, label: '👍 Yes' }, { v: false, label: '👎 No' }].map(({ v, label }) => (
                <button
                  key={String(v)}
                  onClick={() => setWouldRepeat(v)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all"
                  style={
                    wouldRepeat === v
                      ? { background: 'rgba(255,155,115,0.16)', color: 'var(--coral-deep)', border: '1.5px solid var(--coral)' }
                      : { background: 'var(--canvas)', color: 'var(--ink-3)', border: '1.5px solid transparent' }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Focus type */}
          <div>
            <label className="block text-xs font-black uppercase tracking-widest mb-2" style={{ color: 'var(--ink-3)' }}>
              Focus type
            </label>
            <select
              value={focusType}
              onChange={e => setFocusType(e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 text-sm font-medium"
              style={{ background: 'var(--canvas)', color: 'var(--ink)', border: '1px solid var(--line-2)' }}
            >
              {FOCUS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-black uppercase tracking-widest mb-2" style={{ color: 'var(--ink-3)' }}>
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Key wins, blockers, next steps…"
              rows={3}
              className="w-full rounded-xl px-4 py-3 text-sm resize-none"
              style={{ background: 'var(--canvas)', color: 'var(--ink)', border: '1px solid var(--line-2)' }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving || feltScore === 0}
            className="flex-1 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40"
            style={{ background: 'linear-gradient(150deg, var(--coral), var(--coral-deep))', boxShadow: 'var(--shadow-coral)' }}
          >
            {saving
              ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              : <><span className="material-symbols-rounded text-base">save</span> Save Session</>
            }
          </button>
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-xl font-bold text-sm transition-all"
            style={{ background: 'var(--canvas)', color: 'var(--ink-2)' }}
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  )
}
