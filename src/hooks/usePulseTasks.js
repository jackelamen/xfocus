import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'
import { normalizeTask } from '../lib/pulse.js'
import { usePulseStore } from '../store/pulseStore.js'

const TASK_COLUMNS =
  'id, title, notes, status, priority, tags, due_at, start_at, duration_minutes, ' +
  'completed_at, archived_at, deleted_at, list_id, sort_order, created_at, ' +
  'recurrence_rule, google_event_id'

// Fetch the user's lists as Map(id -> row) plus the set of non-archived,
// non-deleted list ids. Tasks in an archived list are treated as archived too.
async function loadListMap(userId) {
  const { data, error } = await supabase
    .from('lists')
    .select('id, name, color, archived_at, deleted_at')
    .eq('user_id', userId)
  if (error) throw error
  const all = new Map()
  const active = new Set()
  for (const l of data || []) {
    all.set(l.id, l)
    if (!l.archived_at && !l.deleted_at) active.add(l.id)
  }
  return { all, active }
}

export function usePulseTasks(userId) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  // Bumped whenever anything in xFocus writes to the tasks table.
  const version = usePulseStore(s => s.version)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const { all: listMap, active: activeLists } = await loadListMap(userId)

      // Active tasks only: not soft-deleted, not archived, top-level (no
      // parent), not completed, and not in a done/cancelled state.
      const { data, error: err } = await supabase
        .from('tasks')
        .select(TASK_COLUMNS)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .is('archived_at', null)
        .is('parent_task_id', null)
        .is('completed_at', null)
        .not('status', 'in', '("done","cancelled")')
        // Due date ascending, tasks with no due date first; sort_order as tiebreak.
        // (Final ordering is enforced client-side in the panel too.)
        .order('due_at', { ascending: true, nullsFirst: true })
        .order('sort_order', { ascending: true })
        .limit(200)
      if (err) throw err

      // Drop anything sitting in an archived or deleted list.
      const rows = (data || []).filter(t => !t.list_id || activeLists.has(t.list_id))
      setTasks(rows.map(t => normalizeTask(t, listMap)))
    } catch (e) {
      // Tables/columns may differ if pointed at a DB without Pulse — degrade gracefully
      setError(e.message)
      setTasks([])
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, version])

  useEffect(() => { load() }, [load])

  return { tasks, loading, error, refresh: load }
}

/**
 * Look up specific tasks by id regardless of status.
 *
 * Blocks store task ids denormalized, so a task attached yesterday may since
 * have been completed, archived or deleted. This hook fetches whatever is
 * still there so the block UI can show live titles and flag stale entries.
 */
export function useTasksByIds(userId, ids) {
  const [taskMap, setTaskMap] = useState(new Map())
  const [loading, setLoading] = useState(false)
  const version = usePulseStore(s => s.version)
  // Sorted + deduped so callers can pass a freshly-built array each render.
  const key = [...new Set((ids || []).filter(Boolean))].sort().join(',')

  useEffect(() => {
    let cancelled = false
    const list = key ? key.split(',') : []
    if (!userId || list.length === 0) { setTaskMap(new Map()); return }
    setLoading(true)
    ;(async () => {
      try {
        const { all: listMap } = await loadListMap(userId)
        const { data, error } = await supabase
          .from('tasks')
          .select(TASK_COLUMNS)
          .eq('user_id', userId)
          .in('id', list)
        if (error) throw error
        if (cancelled) return
        setTaskMap(new Map((data || []).map(t => [t.id, normalizeTask(t, listMap)])))
      } catch (_) {
        if (!cancelled) setTaskMap(new Map())
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [userId, key, version])

  return { taskMap, loading }
}
