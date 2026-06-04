// ============================================================================
// 完課 / 完測 結算（串接資料層 + 純邏輯）
// ============================================================================

import type { Child } from '../types/profile'
import type { Lesson, QuizDef, Skill } from '../types/content'
import { scoreExercises } from './grade'
import { starsFromScore, coinsForStars, XP_RULES } from '../config/levels'
import { addXp, addStars, addCoins, evaluateBadges, type BadgeStats } from './pointsService'
import { evaluateQuiz, cooldownMs, type QuizVerdict } from './promotion'
import { recordLessonResult, getUnitProgress, saveUnitProgress, listLessonProgress } from '../data/progressRepository'
import { ensureCardsForVocab, countMastered } from '../data/srsRepository'
import { getPoints, savePoints } from '../data/pointsRepository'
import { addQuizResult } from '../data/quizRepository'
import { todayStr, uid } from '../data/util'

export interface LessonSummary {
  stars: number
  score: number
  xpGained: number
  coins: number
  newBadges: string[]
}

export async function finishLesson(args: {
  child: Child
  lesson: Lesson
  checkResponses: Record<string, unknown>
  xpFromExercises: number
  speakDone: number
}): Promise<LessonSummary> {
  const { child, lesson } = args
  const checkItems = lesson.exercises.filter((e) => e.phase === 'check')
  const { score, perSkill } = scoreExercises(checkItems, args.checkResponses)
  const stars = starsFromScore(score)
  const perfectBonus = score >= 1 ? XP_RULES.perfectLessonBonus : 0
  const xpGained = args.xpFromExercises + perfectBonus
  const coins = coinsForStars(stars)

  await recordLessonResult({ childId: child.id, lessonId: lesson.id, unitId: lesson.unitId, stars, score })
  await ensureCardsForVocab(child.id, lesson.vocabulary)

  let points = await getPoints(child.id)
  points = addXp(points, xpGained)
  points = addStars(points, stars)
  points = addCoins(points, coins)
  points = { ...points, speakCount: points.speakCount + args.speakDone }

  const allProgress = await listLessonProgress(child.id)
  const stats: BadgeStats = {
    lessonsCompleted: allProgress.filter((p) => p.completed).length,
    hasThreeStar: stars === 3 || allProgress.some((p) => p.stars === 3),
    streakDays: points.streakDays,
    reviewPassed: points.badges.includes('review-pass'),
    promotionPassed: points.badges.includes('promotion-pass'),
    masteredWords: await countMastered(child.id),
    speakCount: points.speakCount,
  }
  const badged = evaluateBadges(points, stats)
  await savePoints(badged.points)

  await addQuizResult({
    id: uid(), childId: child.id, quizId: lesson.id, unitId: lesson.unitId, kind: 'lesson-check',
    score, passed: score >= 0.6, perSkill: perSkill as Partial<Record<Skill, number>>,
    date: todayStr(), createdAt: Date.now(),
  })

  return { stars, score, xpGained, coins, newBadges: badged.newBadges }
}

export interface QuizSummary {
  verdict: QuizVerdict
  xpGained: number
  coins: number
  newBadges: string[]
}

export async function finishQuiz(args: {
  child: Child
  quiz: QuizDef
  responses: Record<string, unknown>
}): Promise<QuizSummary> {
  const { child, quiz } = args
  const { score, perSkill } = scoreExercises(quiz.items, args.responses)
  const verdict = evaluateQuiz(quiz, score, perSkill as Partial<Record<Skill, number>>, child.ageTier)

  const up = await getUnitProgress(child.id, quiz.unitId)
  if (quiz.kind === 'review') {
    up.reviewPassed = up.reviewPassed || verdict.passed
  } else {
    up.promotionAttempts += 1
    if (verdict.passed) {
      up.promotionPassed = true
      up.cooldownUntil = 0
    } else {
      up.cooldownUntil = Date.now() + cooldownMs(up.promotionAttempts)
    }
  }
  await saveUnitProgress(up)

  // 點數獎勵：通過才給大獎，未過也給安慰 XP
  const xpGained = verdict.passed ? (quiz.kind === 'promotion' ? 80 : 40) : 10
  const coins = verdict.passed ? (quiz.kind === 'promotion' ? 30 : 12) : 0

  let points = await getPoints(child.id)
  points = addXp(points, xpGained)
  points = addCoins(points, coins)

  const allProgress = await listLessonProgress(child.id)
  const stats: BadgeStats = {
    lessonsCompleted: allProgress.filter((p) => p.completed).length,
    hasThreeStar: allProgress.some((p) => p.stars === 3),
    streakDays: points.streakDays,
    reviewPassed: points.badges.includes('review-pass') || (quiz.kind === 'review' && verdict.passed),
    promotionPassed: points.badges.includes('promotion-pass') || (quiz.kind === 'promotion' && verdict.passed),
    masteredWords: await countMastered(child.id),
    speakCount: points.speakCount,
  }
  const badged = evaluateBadges(points, stats)
  await savePoints(badged.points)

  await addQuizResult({
    id: uid(), childId: child.id, quizId: quiz.id, unitId: quiz.unitId, kind: quiz.kind,
    score, passed: verdict.passed, perSkill: perSkill as Partial<Record<Skill, number>>,
    date: todayStr(), createdAt: Date.now(),
  })

  return { verdict, xpGained, coins, newBadges: badged.newBadges }
}
