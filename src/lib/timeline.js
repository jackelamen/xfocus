// Timeline geometry shared by the day and week views.
// Kept out of the component file so React Fast Refresh keeps working.

export const HOUR_START = 6
export const HOUR_END = 23
export const TOTAL_MINS = (HOUR_END - HOUR_START) * 60
export const SNAP_MIN = 5          // snap resize to 5-minute steps
export const MIN_BLOCK_MIN = 15    // a block can't be shorter than 15 minutes
export const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i)

export function hourLabel(h) {
  return h === 12 ? '12p' : h > 12 ? `${h - 12}p` : `${h}a`
}
