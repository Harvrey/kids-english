import { getDB } from './db'
import { compositeKey } from './util'
import type { LessonProgress, UnitProgress, StarCount } from '../types/profile'

// ---- LessonProgress ----

export async function getLessonProgress(childId: string, lessonId: string): Promise<LessonProgress | undefined> {
  const db = await getDB()
  return db.get('lessonProgress', compositeKey(childId, lessonId))
}

export async function listLessonProgress(childId: string): Promise<LessonProgress[]> {
  const db = await getDB()
  return db.getAllFromIndex('lessonProgress', 'byChild', childId)
}

/** 記錄完課；星等只升不降（可重刷取高） */
export async function recordLessonResult(args: {
  childId: string
  lessonId: string
  unitId: string
  stars: StarCount
  score: number
}): Promise<LessonProgress> {
  const db = await getDB()
  const id = compositeKey(args.childId, args.lessonId)
  const prev = await db.get('lessonProgress', id)
  const now = Date.now()
  const next: LessonProgress = {
    id,
    childId: args.childId,
    lessonId: args.lessonId,
    unitId: args.unitId,
    stars: Math.max(prev?.stars ?? 0, args.stars) as StarCount,
    bestScore: Math.max(prev?.bestScore ?? 0, args.score),
    completed: true,
    attempts: (prev?.attempts ?? 0) + 1,
    lastPlayedAt: now,
    updatedAt: now,
  }
  await db.put('lessonProgress', next)
  return next
}

// ---- UnitProgress ----

export async function getUnitProgress(childId: string, unitId: string): Promise<UnitProgress> {
  const db = await getDB()
  const id = compositeKey(childId, unitId)
  const found = await db.get('unitProgress', id)
  if (found) return found
  return {
    id,
    childId,
    unitId,
    reviewPassed: false,
    promotionPassed: false,
    promotionAttempts: 0,
    cooldownUntil: 0,
    updatedAt: Date.now(),
  }
}

export async function listUnitProgress(childId: string): Promise<UnitProgress[]> {
  const db = await getDB()
  return db.getAllFromIndex('unitProgress', 'byChild', childId)
}

export async function saveUnitProgress(up: UnitProgress): Promise<void> {
  const db = await getDB()
  await db.put('unitProgress', { ...up, updatedAt: Date.now() })
}
