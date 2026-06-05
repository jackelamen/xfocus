import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { useFocusStore } from '../../store/focusStore.js'
import { levelFromXp } from '../../lib/progression.js'
import toast from 'react-hot-toast'

const NAV = [
  { to: '/focus',   icon: 'timer',             label: 'Focus'   },
  { to: '/blocks',  icon: 'calendar_view_day',  label: 'Blocks'  },
  { to: '/history', icon: 'insights',            label: 'History' },
]

export default function Sidebar({ user }) {
  const streak = useFocusStore(s => s.streak)
  const xp = useFocusStore(s => s.xp)
  const lvl = levelFromXp(xp)
  const navigate = useNavigate()

  async function signOut() {
    await supabase.auth.signOut()
    toast.success('Signed out')
    navigate('/')
  }

  return (
    <aside
      className="flex flex-col items-center py-5 gap-1 flex-shrink-0"
      style={{ width: 64, background: '#12121f', borderRight: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Logo */}
      <div className="mb-4 w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#f97316' }}>
        <span className="text-white font-black text-sm" style={{ fontFamily: 'Manrope, sans-serif' }}>xF</span>
      </div>

      {/* Nav items */}
      {NAV.map(({ to, icon, label }) => (
        <NavLink
          key={to}
          to={to}
          title={label}
          className={({ isActive }) =>
            `w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 ${
              isActive
                ? 'bg-orange-500/20 text-orange-400'
                : 'text-white/30 hover:text-white/70 hover:bg-white/5'
            }`
          }
        >
          <span className="material-symbols-rounded" style={{ fontSize: 20 }}>{icon}</span>
        </NavLink>
      ))}

      <div className="flex-1" />

      {/* Level badge */}
      <div
        title={`${lvl.title} · Level ${lvl.level}`}
        className="relative w-10 h-10 rounded-xl flex items-center justify-center cursor-default mb-1"
        style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.25), rgba(249,115,22,0.1))', border: '1px solid rgba(249,115,22,0.3)' }}
      >
        <span className="text-orange-300 text-xs font-black leading-none">{lvl.level}</span>
        {/* tiny progress arc */}
        <svg className="absolute inset-0" width="40" height="40" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="17" fill="none" stroke="rgba(249,115,22,0.7)" strokeWidth="2" strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 17}
            strokeDashoffset={2 * Math.PI * 17 * (1 - lvl.progress)}
            style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }} />
        </svg>
      </div>

      {/* Streak badge */}
      {streak > 0 && (
        <div
          title={`${streak}-day deep work streak`}
          className="w-10 h-10 rounded-xl flex flex-col items-center justify-center cursor-default"
          style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.2)' }}
        >
          <span className="text-orange-400 text-[9px] font-black leading-none">{streak}</span>
          <span className="material-symbols-rounded text-orange-400" style={{ fontSize: 11 }}>local_fire_department</span>
        </div>
      )}

      {/* Sign out */}
      <button
        onClick={signOut}
        title="Sign out"
        className="w-10 h-10 rounded-xl flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/5 transition-all mt-1"
      >
        <span className="material-symbols-rounded" style={{ fontSize: 18 }}>logout</span>
      </button>
    </aside>
  )
}
