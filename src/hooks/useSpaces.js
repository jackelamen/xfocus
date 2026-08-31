import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'

const LAST_SPACE_KEY = 'xfocus-last-space-id'

// Spaces are xPM's "company" unit — xCompass rolls xFocus time up per space,
// so sessions need a space_id to be attributed correctly. Read-only here;
// spaces themselves are managed in xPM.
export function useSpaces(userId) {
  const [spaces, setSpaces] = useState([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('spaces')
        .select('id, name, color, workspace_id')
        .order('name')
      if (error) throw error
      setSpaces(data || [])
    } catch (_) {
      // No xPM spaces reachable (different DB, RLS, etc.) — degrade gracefully,
      // sessions just save without a space_id like before.
      setSpaces([])
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { load() }, [load])

  return { spaces, loading }
}

export function getLastSpaceId() {
  try { return localStorage.getItem(LAST_SPACE_KEY) || '' } catch (_) { return '' }
}

export function setLastSpaceId(spaceId) {
  try {
    if (spaceId) localStorage.setItem(LAST_SPACE_KEY, spaceId)
    else localStorage.removeItem(LAST_SPACE_KEY)
  } catch (_) { /* ignore */ }
}
