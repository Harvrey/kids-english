// ============================================================================
// 等級與 XP（努力值）— XP 永不歸零，答錯也給嘗試分
// ============================================================================

/** 每升一級所需 XP 採遞增：level n 的門檻 = 100 * n（累進） */
export function levelFromXp(xp: number): { level: number; intoLevel: number; needForNext: number } {
  let level = 1
  let remaining = Math.max(0, Math.floor(xp))
  // 第 level 級 → 第 level+1 級 需要 100*level
  while (remaining >= 100 * level) {
    remaining -= 100 * level
    level += 1
  }
  return { level, intoLevel: remaining, needForNext: 100 * level }
}

export const XP_RULES = {
  attempt: 2, // 答錯也給的嘗試分
  correct: 8, // 答對加碼
  perfectLessonBonus: 20, // 全對完課獎勵
  speakBonus: 5, // 完成跟讀/口說
} as const

/** 由檢核正確率換算星等（0–3 星） */
export function starsFromScore(score: number): 0 | 1 | 2 | 3 {
  if (score >= 0.95) return 3
  if (score >= 0.8) return 2
  if (score >= 0.6) return 1
  return 0
}

/** 完課可得金幣（依星等） */
export function coinsForStars(stars: number): number {
  return [2, 5, 8, 12][stars] ?? 0
}
