import { describe, it, expect } from 'vitest'
import { overlaps, findConflicts, layoutBlocks } from '../overlap.js'
import { timeToMinutes, minutesToTime, addDaysStr, weekStartStr, formatTime } from '../utils.js'
import { levelFromXp } from '../progression.js'

const blk = (id, s, e) => ({ id, date: '2026-09-30', start_time: s, end_time: e })

describe('overlap', () => {
  it('treats touching ranges as non-overlapping', () => {
    expect(overlaps({ start: 600, end: 660 }, { start: 660, end: 720 })).toBe(false)
    expect(overlaps({ start: 600, end: 700 }, { start: 660, end: 720 })).toBe(true)
  })
  it('finds the block already covering an hour', () => {
    const blocks = [blk('a', '10:00', '12:00')]
    expect(findConflicts(blocks, { start: 660, end: 720 }).map(b => b.id)).toEqual(['a'])
    expect(findConflicts(blocks, { start: 720, end: 780 })).toEqual([])
  })
  it('puts clashing blocks in separate lanes', () => {
    const lay = layoutBlocks([blk('a', '10:00', '12:00'), blk('b', '11:00', '12:00')])
    expect(lay.get('a').lane).not.toBe(lay.get('b').lane)
    expect(lay.get('a').lanes).toBe(2)
  })
})

describe('utils', () => {
  it('round-trips times', () => {
    expect(timeToMinutes('10:30')).toBe(630)
    expect(minutesToTime(630)).toMatch(/^10:30/)
  })
  it('does date math', () => {
    expect(addDaysStr('2026-09-30', 1)).toBe('2026-10-01')
    expect(weekStartStr('2026-09-30')).toBe('2026-09-28')
  })
  it('formats seconds', () => {
    expect(formatTime(65)).toBe('01:05')
  })
})

describe('progression', () => {
  it('levels increase with xp', () => {
    expect(levelFromXp(100000).level).toBeGreaterThan(levelFromXp(0).level)
  })
})
