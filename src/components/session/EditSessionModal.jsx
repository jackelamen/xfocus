import React, { useState } from 'react'
import { useFocusStore } from '../../store/focusStore.js'
import { useSpaces } from '../../hooks/useSpaces.js'
import { formatMinutes } from '../../lib/utils.js'

// Lets you fix a session's logged duration or company (or remove it entirely)
// after the fact — for when the timer was left running by mistake and
// actual_minutes ballooned, or the wrong company was picked at save time.
export default function EditSessionModal({ user, session, onClose, onSaved, onDeleted }) {
  const [minutes, setMinutes] = useState(String(session.duration_mins ?? ''))
  const [spaceId, setSpaceId] = useState(session.space_id || '')
  const { spaces } = useSpaces(user?.id)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  const updateSession = useFocusStore(s => s.updateSession)
  const deleteSession = useFocusStore(s => s.deleteSession)

  const parsed = Number(minutes)
  const valid = minutes.trim() !== '' && Number.isFinite(parsed) && parsed >= 0 && parsed <= 1440

  async function handleSave() {
    if (!valid) return
    setSaving(true)
    setErrorMsg(null)
    const { data, error } = await updateSession(session.id, {
      duration_mins: Math.round(parsed),
      space_id: spaceId || null,
    })
    setSaving(false)
    if (error) {
      setErrorMsg('Could not save. Try again.')
      return
    }
    onSaved?.(data)
    onClose()
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setDeleting(true)
    setErrorMsg(null)
    const { error } = await deleteSession(session.id)
    setDeleting(false)
    if (error) {
      setErrorMsg('Could not delete. Try again.')
      return
    }
    onDeleted?.(session.id)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-5"
      style={{ background: 'rgba(43,47,68,0.35)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-6"
        style={{ background: 'var(--surface)', boxShadow: 'var(--shadow)' }}
        onClick={e => e.stopPropagation()}
      >
        <p className="text-base font-extrabold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--ink)' }}>
          Edit session
        </p>
        <p className="text-[11px] mt-0.5" style={{ color: 'var(--ink-3)' }}>
          {session.date}{session.task_names?.length ? ` · ${session.task_names.join(', ')}` : ''}
        </p>

        <label className="block mt-5">
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>
            Focused minutes
          </span>
          <input
            type="number"
            min="0"
            max="1440"
            value={minutes}
            onChange={e => setMinutes(e.target.value)}
            autoFocus
            className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-sm font-bold outline-none"
            style={{ background: 'var(--canvas)', color: 'var(--ink)' }}
          />
          {valid && (
            <span className="text-[10px] mt-1 block" style={{ color: 'var(--ink-4)' }}>
              = {formatMinutes(Math.round(parsed))}
            </span>
          )}
        </label>

        {spaces.length > 0 && (
          <label className="block mt-4">
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>
              Company
            </span>
            <select
              value={spaceId}
              onChange={e => setSpaceId(e.target.value)}
              className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-sm font-bold outline-none"
              style={{ background: 'var(--canvas)', color: 'var(--ink)' }}
            >
              <option value="">Unassigned</option>
              {spaces.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
        )}

        {errorMsg && (
          <p className="text-[11px] mt-3" style={{ color: 'var(--coral-deep)' }}>{errorMsg}</p>
        )}

        <div className="flex items-center gap-2 mt-6">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-[11px] font-bold px-3 py-2 rounded-xl"
            style={{
              color: confirmDelete ? '#fff' : 'var(--coral-deep)',
              background: confirmDelete ? 'var(--coral-deep)' : 'rgba(255,122,77,0.12)',
            }}
          >
            {deleting ? 'Deleting…' : confirmDelete ? 'Confirm delete' : 'Delete session'}
          </button>
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="text-[12px] font-bold px-3.5 py-2 rounded-xl"
            style={{ color: 'var(--ink-3)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!valid || saving}
            className="text-[12px] font-extrabold px-4 py-2 rounded-xl text-white"
            style={{ background: valid ? 'linear-gradient(150deg, var(--coral), var(--coral-deep))' : 'var(--ink-4)' }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
