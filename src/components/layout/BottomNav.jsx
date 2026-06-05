import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { useFocusStore } from '../../store/focusStore.js'
import { levelFromXp } from '../../lib/progression.js'
import toast from 'react-hot-toast'

const NAV = [
  { to: '/focus',   icon: 'timer',            label: 'Focus'   },
  { to: '/blocks',  icon: 'calendar_view_day', label: 'Blocks'  },
  { to: '/history', icon: 'insights',          label: 'History' },
]

// Mobile-only bottom navigation. Hidden at >= sm where the sidebar takes over.
export default function BottomNav() {
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
    <nav
      className="sm:hidden fixed bottom-0 inset-x-0 z-30 flex items-stretch justify-around px-2"
      style={{
        height: 'calc(60px + env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        background: 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--line)',
        boxShadow: '0 -6px 20px rgba(91,110,160,0.10)',
      }}
    >
      {NAV.map(({ to, icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className="flex flex-col items-center justify-center gap-0.5 flex-1 transition-colors"
          style={({ isActive }) => ({ color: isActive ? 'var(--coral-deep)' : 'var(--ink-3)' })}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 23 }}>{icon}</span>
          <span className="text-[10px] font-bold leading-none">{label}</span>
        </NavLink>
      ))}

      {/* Level + streak chip */}
      <div className="flex flex-col items-center justify-center gap-0.5 flex-1" style={{ color: 'var(--coral-deep)' }}>
        <div className="relative w-6 h-6 flex items-center justify-center">
          <span className="text-[11px] font-extrabold leading-none">{lvl.level}</span>
          <svg className="absolute inset-0" width="24" height="24" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 10}
              strokeDashoffset={2 * Math.PI * 10 * (1 - lvl.progress)}
              style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }} />
          </svg>
        </div>
        <span className="text-[10px] font-bold leading-none">
          {streak > 0 ? `${streak}🔥` : 'Lvl'}
        </span>
      </div>

      {/* Sign out */}
      <button
        onClick={signOut}
        className="flex flex-col items-center justify-center gap-0.5 flex-1"
        style={{ color: 'var(--ink-4)' }}
      >
        <span className="material-symbols-rounded" style={{ fontSize: 21 }}>logout</span>
        <span className="text-[10px] font-bold leading-none">Out</span>
      </button>
    </nav>
  )
}
