import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { useFocusStore } from '../../store/focusStore.js'
import { levelFromXp } from '../../lib/progression.js'
import Logo from '../Logo.jsx'
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
      className="hidden sm:flex flex-col items-center py-5 gap-1.5 flex-shrink-0"
      style={{ width: 66, background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(12px)', borderRight: '1px solid var(--line)' }}
    >
      {/* Logo */}
      <div className="mb-4" style={{ filter: 'drop-shadow(0 6px 14px rgba(255,126,77,0.35))' }}>
        <Logo size={38} variant="solid" />
      </div>

      {/* Nav items */}
      {NAV.map(({ to, icon, label }) => (
        <NavLink
          key={to}
          to={to}
          title={label}
          className="w-10 h-10 rounded-[13px] flex items-center justify-center transition-all duration-150"
          style={({ isActive }) =>
            isActive
              ? { background: 'var(--surface)', color: 'var(--coral-deep)', boxShadow: 'var(--shadow-sm)' }
              : { color: 'var(--ink-3)' }
          }
        >
          <span className="material-symbols-rounded" style={{ fontSize: 21 }}>{icon}</span>
        </NavLink>
      ))}

      <div className="flex-1" />

      {/* Level badge */}
      <div
        title={`${lvl.title} · Level ${lvl.level}`}
        className="relative w-10 h-10 rounded-[13px] flex items-center justify-center cursor-default mb-1"
        style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-sm)' }}
      >
        <span className="text-xs font-extrabold leading-none" style={{ color: 'var(--coral-deep)' }}>{lvl.level}</span>
        <svg className="absolute inset-0" width="40" height="40" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="17" fill="none" stroke="var(--coral)" strokeWidth="2.5" strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 17}
            strokeDashoffset={2 * Math.PI * 17 * (1 - lvl.progress)}
            style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }} />
        </svg>
      </div>

      {/* Streak badge */}
      {streak > 0 && (
        <div
          title={`${streak}-day deep work streak`}
          className="w-10 h-10 rounded-[13px] flex flex-col items-center justify-center cursor-default"
          style={{ background: 'rgba(255,155,115,0.14)', color: 'var(--coral-deep)' }}
        >
          <span className="text-[9px] font-extrabold leading-none">{streak}</span>
          <span className="material-symbols-rounded" style={{ fontSize: 12 }}>local_fire_department</span>
        </div>
      )}

      {/* Sign out */}
      <button
        onClick={signOut}
        title="Sign out"
        className="w-10 h-10 rounded-[13px] flex items-center justify-center transition-all mt-1"
        style={{ color: 'var(--ink-4)' }}
      >
        <span className="material-symbols-rounded" style={{ fontSize: 18 }}>logout</span>
      </button>
    </aside>
  )
}
