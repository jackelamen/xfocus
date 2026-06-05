import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'

// Pulse priority is numeric (0=none .. 3=urgent). Map to labels the UI uses.
const PRIORITY_LABEL = { 0: 'none', 1: 'low', 2: 'high', 3: 'urgent' }

// Normalize a Pulse task row into the shape xFocus components expect.
function normalize(t) {
  return {
    id: t.id,
    title: t.title,
    status: t.status,
    list_id: t.list_id,
    // Pulse stores the due date as `due_at` (timestamptz). Alias to due_date
    // (date only) so existing components keep working.
    due_date: t.due_at ? String(t.due_at).slice(0, 10) : null,
    due_at: t.due_at,
    priority: PRIORITY_LABEL[t.priority] ?? 'none',
    priority_num: t.priority,
  }
}

export function usePulseTasks(userId) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      // Read active tasks from Pulse's shared `tasks` table, matching Pulse's
      // own "active task" filters: not soft-deleted, top-level (no parent),
      // not completed, not cancelled, and not done.
      const { data, error: err } = await supabase
        .from('tasks')
        .select('id, title, status, priority, due_at, list_id, sort_order, created_at')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .is('parent_task_id', null)
        .is('completed_at', null)
        .not('status', 'in', '("done","cancelled")')
        .order('priority', { ascending: false })
        .order('due_at', { ascending: true, nullsFirst: false })
        .order('sort_order', { ascending: true })
        .limit(100)
      if (err) throw err
      setTasks((data || []).map(normalize))
    } catch (e) {
      // Tables/columns may differ if pointed at a DB without Pulse — degrade gracefully
      setError(e.message)
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { load() }, [load])

  return { tasks, loading, error, refresh: load }
}
