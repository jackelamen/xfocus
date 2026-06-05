import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { supabaseConfigured } from './lib/supabase.js'
import './index.css'

function ConfigError() {
  return (
    <div className="xf-canvas flex items-center justify-center h-screen px-6">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-extrabold mb-2" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--ink)' }}>
          xFocus isn't configured
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-2)' }}>
          The Supabase environment variables are missing. Set{' '}
          <code style={{ color: 'var(--coral-deep)' }}>VITE_SUPABASE_URL</code> and{' '}
          <code style={{ color: 'var(--coral-deep)' }}>VITE_SUPABASE_ANON_KEY</code>{' '}
          in your hosting environment (e.g. Vercel → Settings → Environment Variables), then redeploy.
        </p>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {supabaseConfigured ? <App /> : <ConfigError />}
  </React.StrictMode>,
)
