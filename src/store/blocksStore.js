import { create } from 'zustand'
import { supabase } from '../lib/supabase.js'
import { todayStr } from '../lib/utils.js'

export const useBlocksStore = create((set, get) => ({
  blocks: [],
  viewDate: todayStr(),
  loading: false,

  setViewDate(date) {
    // Page reloads blocks via an effect on viewDate (passing userId).
    set({ viewDate: date })
  },

  async loadBlocks(userId) {
    const { viewDate } = get()
    if (!userId) return
    set({ loading: true })
    const { data } = await supabase
      .from('time_blocks')
      .select('*')
      .eq('user_id', userId)
      .eq('date', viewDate)
      .order('start_time', { ascending: true })
    set({ blocks: data || [], loading: false })
  },

  async createBlock(userId, payload) {
    const { viewDate } = get()
    const { data, error } = await supabase
      .from('time_blocks')
      .insert({ user_id: userId, date: viewDate, ...payload })
      .select()
      .single()
    if (!error && data) set(s => ({ blocks: [...s.blocks, data].sort((a, b) => a.start_time.localeCompare(b.start_time)) }))
    return { data, error }
  },

  async updateBlock(id, patch) {
    const { data, error } = await supabase.from('time_blocks').update(patch).eq('id', id).select().single()
    if (!error && data) set(s => ({ blocks: s.blocks.map(b => b.id === id ? data : b) }))
    return { data, error }
  },

  async deleteBlock(id) {
    await supabase.from('time_blocks').delete().eq('id', id)
    set(s => ({ blocks: s.blocks.filter(b => b.id !== id) }))
  },

  async addTaskToBlock(blockId, taskId, taskName) {
    const block = get().blocks.find(b => b.id === blockId)
    if (!block) return
    const task_ids = [...(block.task_ids || []), taskId].filter(Boolean)
    const task_names = [...(block.task_names || []), taskName].filter(Boolean)
    return get().updateBlock(blockId, { task_ids, task_names })
  },
}))
