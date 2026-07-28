import { timeToMinutes, minutesToTime } from './utils.js'

/**
 * Overlap handling for the time-block timeline.
 *
 * Blocks are allowed to overlap (sometimes a meeting genuinely sits inside a
 * longer work window), so nothing here blocks a save. Instead we lay clashing
 * blocks out side by side the way a calendar does, and surface a warning with
 * a one-click way to move to the next free slot.
 */

export function blockRange(block) {
  return { start: timeToMinutes(block.start_time), end: timeToMinutes(block.end_time) }
}

// Two half-open intervals [s,e) overlap when each starts before the other ends.
export function overlaps(a, b) {
  return a.start < b.end && b.start < a.end
}

/**
 * Assign each block a lane so overlapping blocks render side by side.
 *
 * Returns Map(blockId -> { lane, lanes }) where `lanes` is the width of the
 * cluster the block belongs to, so a block in a 2-block clash takes half the
 * column even if the rest of the day is single-width.
 */
export function layoutBlocks(blocks) {
  const out = new Map()
  const sorted = [...blocks].sort((a, b) => {
    const ra = blockRange(a), rb = blockRange(b)
    return ra.start - rb.start || rb.end - ra.end
  })

  let cluster = []       // blocks that transitively overlap
  let clusterEnd = -1
  const lanes = []       // lanes[i] = end minute of the last block in that lane

  const flush = () => {
    const width = lanes.length || 1
    for (const { id, lane } of cluster) out.set(id, { lane, lanes: width })
    cluster = []
    lanes.length = 0
    clusterEnd = -1
  }

  for (const b of sorted) {
    const r = blockRange(b)
    // A gap with everything so far closes the cluster.
    if (r.start >= clusterEnd && cluster.length) flush()

    let lane = lanes.findIndex(end => end <= r.start)
    if (lane === -1) { lane = lanes.length; lanes.push(r.end) }
    else lanes[lane] = r.end

    cluster.push({ id: b.id, lane })
    clusterEnd = Math.max(clusterEnd, r.end)
  }
  if (cluster.length) flush()

  return out
}

/** Blocks on the same day that clash with the given range (excluding `ignoreId`). */
export function findConflicts(blocks, { start, end }, ignoreId = null) {
  return blocks
    .filter(b => b.id !== ignoreId)
    .filter(b => overlaps(blockRange(b), { start, end }))
    .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time))
}

/**
 * Earliest start at or after `fromMin` where a block of `durationMin` fits
 * without clashing. Returns null if the day has no room before `dayEndMin`.
 */
export function nextFreeStart(blocks, durationMin, fromMin, dayEndMin, ignoreId = null) {
  const busy = blocks
    .filter(b => b.id !== ignoreId)
    .map(blockRange)
    .sort((a, b) => a.start - b.start)

  let cursor = fromMin
  for (const b of busy) {
    if (b.end <= cursor) continue
    if (b.start - cursor >= durationMin) return cursor
    cursor = Math.max(cursor, b.end)
  }
  return cursor + durationMin <= dayEndMin ? cursor : null
}

// Convenience wrapper returning start/end time strings.
export function nextFreeSlot(blocks, durationMin, fromMin, dayEndMin, ignoreId = null) {
  const start = nextFreeStart(blocks, durationMin, fromMin, dayEndMin, ignoreId)
  if (start === null) return null
  return { start_time: minutesToTime(start), end_time: minutesToTime(start + durationMin) }
}
