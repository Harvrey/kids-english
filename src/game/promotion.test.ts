import { describe, it, expect } from 'vitest'
import { evaluateQuiz, defaultThresholds, cooldownMs } from './promotion'
import type { QuizDef } from '../types/content'

const quiz: QuizDef = {
  schemaVersion: 1, id: 'gate', unitId: 'u', kind: 'promotion', title: '晉級', passThreshold: 0.8, items: [],
}

describe('evaluateQuiz()', () => {
  it('mid：總分與技能地板皆達標才過', () => {
    const v = evaluateQuiz(quiz, 0.9, { reading: 0.9, listening: 0.8 }, 'mid')
    expect(v.passed).toBe(true)
  })

  it('mid：偏科（某技能低於地板）不過', () => {
    const v = evaluateQuiz(quiz, 0.85, { reading: 0.95, listening: 0.5 }, 'mid')
    expect(v.passed).toBe(false)
    expect(v.weakSkills).toContain('listening')
  })

  it('low：寫不設地板、門檻較寬', () => {
    const t = defaultThresholds('low')
    expect(t.pass).toBe(0.7)
    expect(t.skipWriting).toBe(true)
    const lowQuiz: QuizDef = { ...quiz, passThreshold: 0.7 }
    const v = evaluateQuiz(lowQuiz, 0.72, { listening: 0.7, writing: 0.2 }, 'low')
    expect(v.passed).toBe(true) // 寫很低也不擋
  })

  it('冷卻：第一次 30 分、第二次起 24 小時', () => {
    expect(cooldownMs(1)).toBe(30 * 60 * 1000)
    expect(cooldownMs(2)).toBe(24 * 60 * 60 * 1000)
  })
})
