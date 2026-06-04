import { describe, it, expect } from 'vitest'
import { grade, scoreExercises } from './grade'
import type { Exercise } from '../types/content'

const base = { phase: 'check' as const, points: 10 }

describe('grade()', () => {
  it('mcq 正確/錯誤', () => {
    const ex: Exercise = { ...base, type: 'mcq', id: 'q1', skill: 'reading', prompt: 'Hi?', options: [{ id: 'a' }, { id: 'b' }], answerId: 'a' }
    expect(grade(ex, 'a')).toMatchObject({ correct: true, score: 1 })
    expect(grade(ex, 'b')).toMatchObject({ correct: false, score: 0 })
  })

  it('matching 給部分分', () => {
    const ex: Exercise = {
      ...base, type: 'matching', id: 'q2', skill: 'reading',
      pairs: [
        { id: 'p1', left: { text: 'hello' }, right: { text: '你好' } },
        { id: 'p2', left: { text: 'bye' }, right: { text: '再見' } },
      ],
    }
    expect(grade(ex, { p1: 'p1', p2: 'p2' }).score).toBe(1)
    expect(grade(ex, { p1: 'p1', p2: 'p1' }).score).toBe(0.5)
  })

  it('fill-in 容錯（Levenshtein≤1）', () => {
    const ex: Exercise = { ...base, type: 'fill-in', id: 'q3', skill: 'writing', prompt: 'I am ___.', acceptableAnswers: ['happy'] }
    expect(grade(ex, 'happy').correct).toBe(true)
    expect(grade(ex, 'Happy ').correct).toBe(true) // 大小寫/空白
    expect(grade(ex, 'hapy').correct).toBe(true) // 少一字母
    expect(grade(ex, 'sad').correct).toBe(false)
  })

  it('ordering 比對順序', () => {
    const ex: Exercise = { ...base, type: 'ordering', id: 'q4', skill: 'reading', tokens: ['What', 'is', 'your', 'name'] }
    expect(grade(ex, ['What', 'is', 'your', 'name']).correct).toBe(true)
    expect(grade(ex, ['is', 'What', 'your', 'name']).correct).toBe(false)
  })

  it('spelling 不容錯', () => {
    const ex: Exercise = { ...base, type: 'spelling', id: 'q5', skill: 'writing', word: 'cat', mode: 'tiles' }
    expect(grade(ex, 'cat').correct).toBe(true)
    expect(grade(ex, 'cot').correct).toBe(false)
  })

  it('speak 完成即通過、不計分入總分', () => {
    const ex: Exercise = { ...base, type: 'speak', id: 'q6', skill: 'speaking', target: 'Nice to meet you.', mode: 'repeat-required' }
    expect(grade(ex, { done: true }).correct).toBe(true)
  })

  it('scoreExercises 排除 repeat-required 口說', () => {
    const exercises: Exercise[] = [
      { ...base, type: 'mcq', id: 'a', skill: 'reading', prompt: '', options: [{ id: 'x' }, { id: 'y' }], answerId: 'x' },
      { ...base, type: 'speak', id: 'b', skill: 'speaking', target: 'hi', mode: 'repeat-required' },
    ]
    const r = scoreExercises(exercises, { a: 'x', b: { done: true } })
    expect(r.score).toBe(1) // 只計 mcq
    expect(r.perSkill.speaking).toBeUndefined()
  })
})
