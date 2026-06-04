// ============================================================================
// 晉級/測驗評量：門檻、各技能地板、失敗冷卻（純函式）
// ============================================================================

import type { QuizDef, Skill, AgeTier } from '../types/content'

export interface QuizVerdict {
  passed: boolean
  score: number
  /** 未過原因（給「先複習再重試」用） */
  reasons: string[]
  weakSkills: Skill[]
}

const SKILL_LABEL: Record<Skill, string> = {
  listening: '聽',
  speaking: '說',
  reading: '讀',
  writing: '寫',
}

/**
 * 預設門檻（quiz 未指定時依年齡分層）：
 * - low：總分 70%、技能地板 60%、「寫」不設地板
 * - mid/teen：總分 80%、技能地板 70%
 */
export function defaultThresholds(tier: AgeTier): { pass: number; floor: number; skipWriting: boolean } {
  if (tier === 'low') return { pass: 0.7, floor: 0.6, skipWriting: true }
  return { pass: 0.8, floor: 0.7, skipWriting: false }
}

export function evaluateQuiz(
  quiz: QuizDef,
  score: number,
  perSkill: Partial<Record<Skill, number>>,
  tier: AgeTier,
): QuizVerdict {
  const def = defaultThresholds(tier)
  const passThreshold = quiz.passThreshold ?? def.pass
  const reasons: string[] = []
  const weakSkills: Skill[] = []

  if (score < passThreshold) {
    reasons.push(`總分 ${(score * 100) | 0}% 未達 ${(passThreshold * 100) | 0}%`)
  }

  // 技能地板：只檢查「測驗中實際出現的技能」
  const floors = quiz.skillFloors
  for (const skill of Object.keys(perSkill) as Skill[]) {
    if (def.skipWriting && skill === 'writing') continue
    const floor = floors?.[skill] ?? def.floor
    const v = perSkill[skill] ?? 0
    if (v < floor) {
      reasons.push(`${SKILL_LABEL[skill]} ${(v * 100) | 0}% 未達地板 ${(floor * 100) | 0}%`)
      weakSkills.push(skill)
    }
  }

  return { passed: reasons.length === 0, score, reasons, weakSkills }
}

/** 失敗後冷卻（毫秒）：第1次 30 分、第2次起 隔日（簡化為 24 小時） */
export function cooldownMs(attempts: number): number {
  if (attempts <= 1) return 30 * 60 * 1000
  return 24 * 60 * 60 * 1000
}

export function isInCooldown(cooldownUntil: number, now = Date.now()): boolean {
  return cooldownUntil > now
}
