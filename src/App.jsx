import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './hooks/useAuth.js'
import { useFocusStore } from './store/focusStore.js'
import { useBlocksStore } from './store/blocksStore.js'
import Sidebar from './components/layout/Sidebar.jsx'
import Login from './pages/Login.jsx'
import FocusPage from './pages/FocusPage.jsx'
import BlocksPage from './pages/BlocksPage.jsx'
import HistoryPage from './pages/HistoryPage.jsx'

function AuthGate() {
  const { user, loading } = useAuth()
  const loadAll = useFocusStore(s => s.loadAll)
  const loadBlocks = useBlocksStore(s => s.loadBlocks)

  useEffect(() => {
    if (user) {
      loadAll(user.id)
      loadBlocks(user.id)
    }
  }, [user])

  if (loading) return (
    <div className="flex items-center justify-center h-screen" style={{ background: '#0f0f1a' }}>
      <div className="text-center">
        <div className="w-10 h-10 rounded-full border-2 border-orange-500 border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-sm font-medium text-white/40">Loading xFocus…</p>
      </div>
    </div>
  )

  if (!user) return <Login />

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0f0f1a' }}>
      <Sidebar user={user} />
      <main className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<Navigate to="/focus" replace />} />
          <Route path="/focus" element={<FocusPage user={user} />} />
          <Route path="/blocks" element={<BlocksPage user={user} />} />
          <Route path="/history" element={<HistoryPage user={user} />} />
          <Route path="*" element={<Navigate to="/focus" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1a1a2e', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' },
        }}
      />
      <Routes>
        <Route path="/*" element={<AuthGate />} />
      </Routes>
    </BrowserRouter>
  )
}
