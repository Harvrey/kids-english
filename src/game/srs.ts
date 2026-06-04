// ============================================================================
// 字彙間隔重複（簡化 SM-2）。純函式，可單元測試。
// 間隔序列大致為 1 → 2 → 4 → 7 → 15 → 30 天；答錯打回 1 天。
// ============================================================================

import type { SrsCard } from '../types/profile'
import { addDaysStr } from '../data/util'

/** 作答品質：0=不會、1=勉強、2=會、3=很熟 */
export type Recall = 0 | 1 | 2 | 3

const STEPS = [1, 2, 4, 7, 15, 30]

export function reviewCard(card: SrsCard, recall: Recall, today = new Date()): SrsCard {
  let { ease, reps, lapses, intervalDays } = card

  if (recall <= 0) {
    // 完全答錯：打回起點
    reps = 0
    lapses += 1
    intervalDays = 1
    ease = Math.max(1.3, ease - 0.2)
  } else {
    reps += 1
    // 依 recall 微調 ease
    ease = clamp(ease + (recall - 2) * 0.1, 1.3, 3.0)
    const idx = Math.min(reps - 1, STEPS.length - 1)
    intervalDays = Math.round(STEPS[idx] * (ease / 2.5))
    if (intervalDays < 1) intervalDays = 1
  }

  return {
    ...card,
    ease,
    reps,
    lapses,
    intervalDays,
    dueDate: addDaysStr(intervalDays, today),
    updatedAt: today.getTime(),
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

/** 每日複習上限（防雪崩） */
export const SRS_DAILY_CAP = 15
