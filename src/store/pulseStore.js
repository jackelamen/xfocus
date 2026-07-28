import { create } from 'zustand'

/**
 * Tiny revision counter for Pulse task data.
 *
 * Several components read Pulse tasks independently (the side panel, the block
 * editor, the chips on each timeline block). Rather than lift all of that into
 * one shared cache, every reader watches `version` and refetches when it moves.
 * Any code that writes to the `tasks` table calls `bumpTasks()` afterwards.
 */
export const usePulseStore = create(set => ({
  version: 0,
  bump: () => set(s => ({ version: s.version + 1 })),
}))

export function bumpTasks() {
  usePulseStore.getState().bump()
}
