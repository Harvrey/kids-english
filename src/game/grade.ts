// ============================================================================
// 自動批改（純函式，可單元測試）。回傳 score 為 0..1，支援部分分。
// ============================================================================

import type { Exercise } from '../types/content'
import { fuzzyEqual, normalizeText } from './text'

export interface GradeResult {
  correct: boolean
  score: number // 0..1
  /** 給回饋顯示用的正解文字 */
  correctAnswer?: string
}

// 各題型對應的作答型別
export type McqResponse = string // optionId
export type MatchingResponse = Record<string, string> // leftPairId -> chosen rightPairId
export type FillInResponse = string
export type OrderingResponse = string[] // tokens 的選擇順序
export type SpellingResponse = string
export type SpeakResponse = { done: boolean; selfStars?: number }
export type ReadingResponse = Record<string, string> // questionId -> optionId

export function grade(ex: Exercise, response: unknown): GradeResult {
  switch (ex.type) {
    case 'mcq':
    case 'listen-choose': {
      const r = response as McqResponse
      const correct = r === ex.answerId
      return { correct, score: correct ? 1 : 0, correctAnswer: ex.answerId }
    }

    case 'matching': {
      const r = (response as MatchingResponse) ?? {}
      const total = ex.pairs.length || 1
      let ok = 0
      for (const p of ex.pairs) {
        if (r[p.id] === p.id) ok++
      }
      const score = ok / total
      return { correct: ok === total, score }
    }

    case 'fill-in': {
      const r = (response as FillInResponse) ?? ''
      const tolerant = ex.normalize !== false
      const correct = ex.acceptableAnswers.some((ans) => fuzzyEqual(r, ans, tolerant))
      return { correct, score: correct ? 1 : 0, correctAnswer: ex.acceptableAnswers[0] }
    }

    case 'ordering': {
      const r = (response as OrderingResponse) ?? []
      const want = ex.tokens.map(normalizeText).join(' ')
      const got = r.map(normalizeText).join(' ')
      const correct = want === got
      return { correct, score: correct ? 1 : 0, correctAnswer: ex.tokens.join(' ') }
    }

    case 'spelling': {
      const r = (response as SpellingResponse) ?? ''
      const correct = fuzzyEqual(r, ex.word, false) // 拼字不容錯
      return { correct, score: correct ? 1 : 0, correctAnswer: ex.word }
    }

    case 'speak': {
      const r = (response as SpeakResponse) ?? { done: false }
      // 口說不計分（不靠機器辨識）；完成跟讀即視為通過
      return { correct: !!r.done, score: r.done ? 1 : 0 }
    }

    case 'reading': {
      const r = (response as ReadingResponse) ?? {}
      const total = ex.questions.length || 1
      let ok = 0
      for (const q of ex.questions) {
        if (r[q.id] === q.answerId) ok++
      }
      return { correct: ok === total, score: ok / total }
    }
  }
}

/** 計算一組題目的總分與各技能分數（口說 repeat-required 不列入計分） */
export function scoreExercises(
  exercises: Exercise[],
  responses: Record<string, unknown>,
): { score: number; perSkill: Record<string, number> } {
  const skillAgg: Record<string, { sum: number; n: number }> = {}
  let sum = 0
  let n = 0
  for (const ex of exercises) {
    if (ex.type === 'speak' && ex.mode === 'repeat-required') continue // 不計分
    const g = grade(ex, responses[ex.id])
    sum += g.score
    n += 1
    const s = skillAgg[ex.skill] ?? { sum: 0, n: 0 }
    s.sum += g.score
    s.n += 1
    skillAgg[ex.skill] = s
  }
  const perSkill: Record<string, number> = {}
  for (const [k, v] of Object.entries(skillAgg)) perSkill[k] = v.n ? v.sum / v.n : 0
  return { score: n ? sum / n : 0, perSkill }
}
