import { create } from 'zustand'
import { supabase } from '../lib/supabase.js'
import { todayStr, addDaysStr, weekStartStr } from '../lib/utils.js'

// Dates covered by the current view: one day, or Mon–Sun for the week view.
function rangeFor(viewDate, viewMode) {
  if (viewMode === 'week') {
    const start = weekStartStr(viewDate)
    return { from: start, to: addDaysStr(start, 6) }
  }
  return { from: viewDate, to: viewDate }
}

export const useBlocksStore = create((set, get) => ({
  blocks: [],
  viewDate: todayStr(),
  viewMode: 'day',       // 'day' | 'week'
  loading: false,

  setViewDate(date) {
    // Page reloads blocks via an effect on viewDate (passing userId).
    set({ viewDate: date })
  },

  setViewMode(mode) {
    set({ viewMode: mode })
  },

  // The dates rendered by the current view, in order.
  visibleDates() {
    const { viewDate, viewMode } = get()
    if (viewMode !== 'week') return [viewDate]
    const start = weekStartStr(viewDate)
    return Array.from({ length: 7 }, (_, i) => addDaysStr(start, i))
  },

  async loadBlocks(userId) {
    const { viewDate, viewMode } = get()
    if (!userId) return
    const { from, to } = rangeFor(viewDate, viewMode)
    set({ loading: true })
    const { data } = await supabase
      .from('time_blocks')
      .select('*')
      .eq('user_id', userId)
      .gte('date', from)
      .lte('date', to)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })
    set({ blocks: data || [], loading: false })
  },

  async createBlock(userId, payload) {
    const { viewDate } = get()
    // `payload.date` wins so the week view (and the planner) can write to any
    // day without moving the anchor date.
    const { data, error } = await supabase
      .from('time_blocks')
      .insert({ user_id: userId, date: viewDate, ...payload })
      .select()
      .single()
    if (!error && data) set(s => ({ blocks: sortBlocks([...s.blocks, data]) }))
    return { data, error }
  },

  // Insert several blocks in one round trip (used by the day planner).
  async createBlocks(userId, payloads) {
    const { viewDate } = get()
    if (!payloads?.length) return { data: [], error: null }
    const rows = payloads.map(p => ({ user_id: userId, date: viewDate, ...p }))
    const { data, error } = await supabase.from('time_blocks').insert(rows).select()
    if (!error && data) set(s => ({ blocks: sortBlocks([...s.blocks, ...data]) }))
    return { data, error }
  },

  async updateBlock(id, patch) {
    const { data, error } = await supabase.from('time_blocks').update(patch).eq('id', id).select().single()
    if (!error && data) set(s => ({ blocks: sortBlocks(s.blocks.map(b => b.id === id ? data : b)) }))
    return { data, error }
  },

  async deleteBlock(id) {
    await supabase.from('time_blocks').delete().eq('id', id)
    set(s => ({ blocks: s.blocks.filter(b => b.id !== id) }))
  },

  async addTaskToBlock(blockId, taskId, taskName) {
    const block = get().blocks.find(b => b.id === blockId)
    if (!block) return { error: { message: 'Block not found' } }
    const existing = block.task_ids || []
    // Same task twice on one block is never intentional — treat as a no-op.
    if (existing.includes(taskId)) return { duplicate: true }
    const task_ids = [...existing, taskId].filter(Boolean)
    const task_names = [...(block.task_names || []), taskName].filter(Boolean)
    return get().updateBlock(blockId, { task_ids, task_names })
  },

  // Detach a task from a block. Removes by id, keeping the parallel
  // task_names array aligned by position.
  async removeTaskFromBlock(blockId, taskId) {
    const block = get().blocks.find(b => b.id === blockId)
    if (!block) return { error: { message: 'Block not found' } }
    const ids = block.task_ids || []
    const names = block.task_names || []
    const idx = ids.indexOf(taskId)
    if (idx === -1) return { error: null }
    const task_ids = ids.filter((_, i) => i !== idx)
    const task_names = names.filter((_, i) => i !== idx)
    return get().updateBlock(blockId, { task_ids, task_names })
  },

  // Replace a block's whole task set (used by the block form when several
  // edits are staged before saving).
  async setBlockTasks(blockId, task_ids, task_names) {
    return get().updateBlock(blockId, { task_ids, task_names })
  },
}))

function sortBlocks(list) {
  return [...list].sort((a, b) =>
    a.date === b.date
      ? String(a.start_time).localeCompare(String(b.start_time))
      : String(a.date).localeCompare(String(b.date))
  )
}
