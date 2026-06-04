import { describe, it, expect } from 'vitest'
import { reviewCard } from './srs'
import type { SrsCard } from '../types/profile'

function makeCard(over: Partial<SrsCard> = {}): SrsCard {
  return {
    id: 'c__cat', childId: 'c', wordId: 'cat', word: 'cat', zh: '貓',
    ease: 2.5, intervalDays: 0, dueDate: '2026-01-01', reps: 0, lapses: 0, updatedAt: 0,
    ...over,
  }
}

describe('reviewCard()', () => {
  const today = new Date('2026-06-04T08:00:00')

  it('答對會增加 reps 與 interval、設定未來到期日', () => {
    const c = reviewCard(makeCard(), 3, today)
    expect(c.reps).toBe(1)
    expect(c.intervalDays).toBeGreaterThanOrEqual(1)
    expect(c.dueDate > '2026-06-04').toBe(true)
  })

  it('連續答對 interval 逐步變長', () => {
    let c = makeCard()
    const intervals: number[] = []
    for (let i = 0; i < 4; i++) {
      c = reviewCard(c, 2, today)
      intervals.push(c.intervalDays)
    }
    expect(intervals[3]).toBeGreaterThan(intervals[0])
  })

  it('答錯（recall=0）打回 1 天並累計 lapses', () => {
    const c = reviewCard(makeCard({ reps: 3, intervalDays: 7 }), 0, today)
    expect(c.intervalDays).toBe(1)
    expect(c.reps).toBe(0)
    expect(c.lapses).toBe(1)
    expect(c.dueDate).toBe('2026-06-05')
  })
})
