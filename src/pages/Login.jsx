import React, { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import Logo from '../components/Logo.jsx'
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

  const inputStyle = { background: 'var(--surface)', color: 'var(--ink)', border: '1.5px solid var(--line-2)' }

  return (
    <div className="xf-canvas flex items-center justify-center h-screen px-5">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="mb-4" style={{ filter: 'drop-shadow(0 10px 22px rgba(255,126,77,0.4))' }}>
            <Logo size={64} variant="solid" />
          </div>
          <h1 className="text-2xl font-extrabold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--ink)' }}>xFocus</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--ink-3)' }}>Deep work, by design.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full px-4 py-3.5 rounded-2xl text-sm font-medium outline-none transition-all"
            style={inputStyle}
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full px-4 py-3.5 rounded-2xl text-sm font-medium outline-none transition-all"
            style={inputStyle}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(150deg, var(--coral), var(--coral-deep))', boxShadow: 'var(--shadow-coral)' }}
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

        <p className="text-center text-xs mt-6" style={{ color: 'var(--ink-4)' }}>
          Sign in with your Pulse account
        </p>
      </div>
    </div>
  )
}
