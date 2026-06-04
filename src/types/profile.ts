// ============================================================================
// 使用者檔案與進度型別（存於 IndexedDB，每個小孩一份命名空間）
// ============================================================================

import type { AgeTier, Skill } from './content'

export interface Child {
  id: string
  name: string
  avatarEmoji: string
  ageTier: AgeTier
  grade: number
  createdAt: number
  updatedAt: number
  /** 軟刪除旗標（為未來雲端同步預留） */
  deleted?: boolean
}

export type StarCount = 0 | 1 | 2 | 3

export interface LessonProgress {
  /** key = childId + '__' + lessonId */
  id: string
  childId: string
  lessonId: string
  unitId: string
  stars: StarCount
  bestScore: number // 0..1
  completed: boolean
  attempts: number
  lastPlayedAt: number
  updatedAt: number
}

export interface UnitProgress {
  /** key = childId + '__' + unitId */
  id: string
  childId: string
  unitId: string
  reviewPassed: boolean
  promotionPassed: boolean
  promotionAttempts: number
  /** 階梯冷卻：時間戳，未到不可重考 */
  cooldownUntil: number
  updatedAt: number
}

export interface PointsState {
  /** key = childId */
  childId: string
  xp: number
  coins: number
  streakDays: number
  /** 最近活躍日 YYYY-MM-DD（本地時間） */
  lastActiveDate: string
  ownedItems: string[]
  equippedAvatar: string | null
  badges: string[]
  totalStars: number
  /** 累計完成口說錄音次數（給徽章用） */
  speakCount: number
  updatedAt: number
}

export interface SrsCard {
  /** key = childId + '__' + wordId */
  id: string
  childId: string
  wordId: string
  word: string
  zh: string
  emoji?: string
  ease: number
  intervalDays: number
  /** 到期日 YYYY-MM-DD（本地時間） */
  dueDate: string
  reps: number
  lapses: number
  updatedAt: number
}

/** 測驗作答結果（用於批改與報表） */
export interface QuizResult {
  id: string
  childId: string
  quizId: string
  unitId: string
  kind: 'lesson-check' | 'review' | 'promotion'
  score: number // 0..1
  passed: boolean
  perSkill: Partial<Record<Skill, number>>
  date: string // YYYY-MM-DD
  createdAt: number
}

/** 完整備份檔（匯出/匯入） */
export interface BackupBundle {
  schemaVersion: number
  exportedAt: number
  children: Child[]
  lessonProgress: LessonProgress[]
  unitProgress: UnitProgress[]
  points: PointsState[]
  srsCards: SrsCard[]
  quizResults: QuizResult[]
}
