import React, { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import toast from 'react-hot-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) toast.error(error.message)
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-center h-screen" style={{ background: '#0f0f1a' }}>
      <div className="w-full max-w-sm px-4">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#f97316' }}>
            <span className="text-white font-black text-2xl" style={{ fontFamily: 'Manrope, sans-serif' }}>xF</span>
          </div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>xFocus</h1>
          <p className="text-sm text-white/30 mt-1">Deep work, by design.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full px-4 py-3 rounded-xl text-sm font-medium text-white placeholder-white/30 outline-none focus:ring-2 transition-all"
            style={{ background: '#1a1a2e', border: '1.5px solid rgba(255,255,255,0.08)', focusRingColor: '#f97316' }}
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full px-4 py-3 rounded-xl text-sm font-medium text-white placeholder-white/30 outline-none focus:ring-2 transition-all"
            style={{ background: '#1a1a2e', border: '1.5px solid rgba(255,255,255,0.08)' }}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            style={{ background: '#f97316' }}
          >
            {loading ? (
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <>
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>login</span>
                Sign In
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-white/20 mt-6">
          Sign in with your Pulse account
        </p>
      </div>
    </div>
  )
}
