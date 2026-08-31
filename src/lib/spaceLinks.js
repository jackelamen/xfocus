// Resolves a Pulse task to its xPM company (space) via pulse_xpm_task_links —
// the same bridge table xPM/Pulse already use to sync completion status, so
// it's the one reliable link, not the free-text tags on the task itself.
//
// Why not use tags[] directly: a task's tags are only a reliable signal when
// xPM sent the task INTO Pulse (tags: [project.pulse_tag || project.name]),
// which already writes a resolved link into this bridge table at creation
// time. Tasks created natively in Pulse get linked via a fuzzy exact-name
// match that often doesn't resolve (short tags like "s7" don't equal a full
// project name like "S7 Biz Dev - June 26") and can sit unresolved
// ('needs_review') indefinitely. Reading the bridge table sidesteps all of
// that: if it's there, it's trustworthy; if not, there's nothing to guess.
import { supabase } from './supabase.js'

// taskIds: array of Pulse task ids (uuid). Returns Map(pulse_task_id -> space_id)
// for whichever of them have a resolved xPM project link.
export async function resolveSpaceForTasks(taskIds) {
  const ids = [...new Set((taskIds || []).filter(Boolean))].map(String)
  if (ids.length === 0) return new Map()
  try {
    const { data, error } = await supabase
      .from('pulse_xpm_task_links')
      .select('pulse_task_id, projects(space_id)')
      .in('pulse_task_id', ids)
      .not('xpm_project_id', 'is', null)
    if (error) throw error
    const map = new Map()
    for (const row of data || []) {
      const spaceId = row.projects?.space_id
      if (spaceId) map.set(row.pulse_task_id, spaceId)
    }
    return map
  } catch (_) {
    // Bridge table unreachable (different DB, RLS, etc.) — no auto-suggestion,
    // the manual picker still works.
    return new Map()
  }
}
