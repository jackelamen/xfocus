import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'

export function usePulseTasks(userId) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      // Read from the shared 'tasks' table (Pulse's table — neutral name, no prefix)
      const { data, error: err } = await supabase
        .from('tasks')
        .select('id, title, status, priority, due_date, list_id')
        .eq('user_id', userId)
        .not('status', 'eq', 'done')
        .order('created_at', { ascending: false })
        .limit(100)
      if (err) throw err
      setTasks(data || [])
    } catch (e) {
      // Pulse tables may not exist yet in local DB — degrade gracefully
      setError(e.message)
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { load() }, [load])

  return { tasks, loading, error, refresh: load }
}
