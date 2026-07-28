// Pulse (tasks app) integration helpers.
import { supabase } from './supabase.js'
import { bumpTasks } from '../store/pulseStore.js'
//
// xFocus reads tasks straight out of Pulse's Supabase tables, but for "open
// this in Pulse" we need Pulse's web origin. Configurable so local dev can
// point at http://localhost:3000.
export const PULSE_URL = (
  import.meta.env.VITE_PULSE_URL ||
  'https://lightskyblue-wolverine-166414.hostingersite.com'
).replace(/\/$/, '')

// Deep link to a single task. Pulse's app shell reads `?task=<id>` and opens
// the task detail panel over whichever view it lands on.
export function pulseTaskUrl(task) {
  if (!task?.id) return PULSE_URL
  const base = task.list_id ? `${PULSE_URL}/lists/${task.list_id}` : `${PULSE_URL}/inbox`
  return `${base}?task=${task.id}`
}

// Pulse priority is numeric (0=none .. 3=urgent). Map to the labels the UI uses.
export const PRIORITY_LABEL = { 0: 'none', 1: 'low', 2: 'high', 3: 'urgent' }

// Normalize a Pulse task row into the shape xFocus components expect.
// `lists` is an optional Map(list_id -> list row) used to attach list context.
export function normalizeTask(t, lists) {
  const list = lists?.get?.(t.list_id) || null
  return {
    id: t.id,
    title: t.title,
    notes: t.notes || null,
    status: t.status,
    tags: t.tags || [],
    list_id: t.list_id,
    list_name: list?.name || null,
    list_color: list?.color || null,
    // Pulse stores the due date as `due_at` (timestamptz). Alias to due_date
    // (date only) so existing components keep working.
    due_date: t.due_at ? String(t.due_at).slice(0, 10) : null,
    due_at: t.due_at,
    start_at: t.start_at,
    duration_minutes: t.duration_minutes ?? null,
    completed_at: t.completed_at ?? null,
    archived_at: t.archived_at ?? null,
    deleted_at: t.deleted_at ?? null,
    priority: PRIORITY_LABEL[t.priority] ?? 'none',
    priority_num: t.priority,
    // Needed to mirror Pulse's completion + calendar-sync semantics.
    recurrence_rule: t.recurrence_rule ?? null,
    google_event_id: t.google_event_id ?? null,
  }
}

// True when a task should no longer appear as schedulable work in xFocus.
export function isTaskInactive(t) {
  if (!t) return false
  return Boolean(
    t.deleted_at ||
    t.archived_at ||
    t.completed_at ||
    t.status === 'done' ||
    t.status === 'cancelled'
  )
}

/**
 * Complete or reopen a Pulse task from inside xFocus.
 *
 * Mirrors Pulse's own toggle semantics exactly (lib/tasks/queries.ts →
 * useToggleComplete) so the two apps stay consistent, including the Google
 * Calendar sync flags: completing a synced task queues its calendar event for
 * deletion, reopening a scheduled non-recurring task queues a re-push.
 * Pulse's Supabase triggers handle the downstream xPM completion sync.
 */
export async function setTaskCompleted(task, completed) {
  const patch = completed
    ? { completed_at: new Date().toISOString(), status: 'done' }
    : { completed_at: null, status: 'todo' }

  if (completed) {
    if (task.google_event_id) patch.google_sync_state = 'delete_pending'
  } else if (task.start_at && !task.recurrence_rule) {
    patch.google_sync_state = 'pending'
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(patch)
    .eq('id', task.id)
    .select()
    .single()

  if (!error) bumpTasks()
  return { data, error }
}

// Human label for why a task is inactive (used on block task chips).
export function inactiveReason(t) {
  if (!t) return null
  if (t.deleted_at) return 'Deleted in Pulse'
  if (t.archived_at) return 'Archived'
  if (t.completed_at || t.status === 'done') return 'Completed'
  if (t.status === 'cancelled') return 'Cancelled'
  return null
}
