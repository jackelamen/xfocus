import React, { useState, useEffect } from 'react'
import { useFocusStore } from '../../store/focusStore.js'

export default function IntentionBar({ user }) {
  const intention = useFocusStore(s => s.intention)
  const saveIntention = useFocusStore(s => s.saveIntention)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    if (editing) setDraft(intention?.text || '')
  }, [editing])

  async function save() {
    const text = draft.trim()
    if (!text) { setEditing(false); return }
    await saveIntention(user.id, text)
    setEditing(false)
  }

  const eyebrow = (
    <div className="flex items-center gap-1.5 mb-2">
      <span className="material-symbols-rounded" style={{ fontSize: 15, color: 'var(--coral-deep)' }}>wb_sunny</span>
      <span className="text-[11px] font-extrabold uppercase tracking-[0.16em]" style={{ color: 'var(--coral-deep)' }}>
        Today I will
      </span>
    </div>
  )

  const headlineStyle = {
    fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 24,
    lineHeight: 1.28, letterSpacing: '-0.015em', color: 'var(--ink)',
  }

  if (editing) {
    return (
      <div>
        {eyebrow}
        <input
          autoFocus
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
          placeholder="set your intention…"
          className="w-full bg-transparent outline-none"
          style={{ ...headlineStyle, borderBottom: '2px solid var(--coral)', paddingBottom: 4 }}
        />
        <div className="mt-2.5 flex gap-2">
          <button onClick={save} className="text-xs font-bold px-3 py-1 rounded-lg" style={{ background: 'var(--coral)', color: '#fff' }}>Save</button>
          <button onClick={() => setEditing(false)} className="text-xs font-semibold px-2 py-1" style={{ color: 'var(--ink-3)' }}>Cancel</button>
        </div>
      </div>
    )
  }

  if (intention?.text) {
    return (
      <button onClick={() => setEditing(true)} className="text-left w-full">
        {eyebrow}
        <h1 style={headlineStyle}>{intention.text}</h1>
        <span className="inline-flex items-center gap-1.5 mt-2 text-[13px]" style={{ color: 'var(--ink-3)' }}>
          <span className="material-symbols-rounded" style={{ fontSize: 14 }}>edit</span>
          edit intention
        </span>
      </button>
    )
  }

  return (
    <button onClick={() => setEditing(true)} className="text-left w-full">
      {eyebrow}
      <h1 style={{ ...headlineStyle, color: 'var(--ink-4)' }}>Set today's intention…</h1>
    </button>
  )
}
