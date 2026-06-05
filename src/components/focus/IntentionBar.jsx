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

  if (editing) {
    return (
      <div className="flex items-center gap-2 px-5 py-3 rounded-2xl" style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)' }}>
        <span className="material-symbols-rounded text-orange-400 text-lg flex-shrink-0">flag</span>
        <input
          autoFocus
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
          placeholder="Today I will…"
          className="flex-1 bg-transparent outline-none text-sm font-semibold text-white placeholder-white/30"
        />
        <button onClick={save} className="text-orange-400 font-bold text-xs px-3 py-1 rounded-lg transition-all hover:bg-orange-500/20">Save</button>
        <button onClick={() => setEditing(false)} className="text-white/30 text-xs px-2 py-1 rounded-lg">Cancel</button>
      </div>
    )
  }

  if (intention?.text) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="flex items-center gap-3 px-5 py-3 rounded-2xl text-left w-full transition-all group hover:bg-white/5"
        style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.15)' }}
      >
        <span className="material-symbols-rounded text-orange-400 text-lg flex-shrink-0">flag</span>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-orange-400/60 mb-0.5">Today's Intention</p>
          <p className="text-sm font-semibold text-white/90 truncate">{intention.text}</p>
        </div>
        <span className="material-symbols-rounded text-white/20 group-hover:text-white/40 transition-colors" style={{ fontSize: 16 }}>edit</span>
      </button>
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="flex items-center gap-3 px-5 py-3 rounded-2xl w-full transition-all hover:bg-white/5"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.1)' }}
    >
      <span className="material-symbols-rounded text-white/20 text-lg">flag</span>
      <span className="text-sm text-white/30 italic">Set today's intention…</span>
    </button>
  )
}
