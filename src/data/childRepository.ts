import { getDB } from './db'
import { uid } from './util'
import { ageTierForGrade } from '../config/ladder'
import { DEFAULT_AVATAR, shopItem } from '../config/shop'
import type { Child, PointsState } from '../types/profile'
import { todayStr } from './util'

export async function listChildren(): Promise<Child[]> {
  const db = await getDB()
  const all = await db.getAll('children')
  return all.filter((c) => !c.deleted).sort((a, b) => a.createdAt - b.createdAt)
}

export async function getChild(id: string): Promise<Child | undefined> {
  const db = await getDB()
  return db.get('children', id)
}

export async function createChild(input: { name: string; grade: number; avatarEmoji?: string }): Promise<Child> {
  const db = await getDB()
  const now = Date.now()
  const child: Child = {
    id: uid(),
    name: input.name.trim() || '小星航員',
    grade: input.grade,
    ageTier: ageTierForGrade(input.grade),
    avatarEmoji: input.avatarEmoji || shopItem(DEFAULT_AVATAR)?.emoji || '👨‍🚀',
    createdAt: now,
    updatedAt: now,
  }
  await db.put('children', child)

  // 建立對應的點數狀態
  const points: PointsState = {
    childId: child.id,
    xp: 0,
    coins: 0,
    streakDays: 0,
    lastActiveDate: todayStr(),
    ownedItems: [DEFAULT_AVATAR],
    equippedAvatar: DEFAULT_AVATAR,
    badges: [],
    totalStars: 0,
    speakCount: 0,
    updatedAt: now,
  }
  await db.put('points', points)
  return child
}

export async function updateChild(child: Child): Promise<void> {
  const db = await getDB()
  await db.put('children', { ...child, updatedAt: Date.now() })
}

/** 刪除小孩：單一交易批次清除其所有資料，避免孤兒 */
export async function deleteChild(childId: string): Promise<void> {
  const db = await getDB()
  await db.delete('children', childId)
  await db.delete('points', childId)

  const stores = ['lessonProgress', 'unitProgress', 'srsCards', 'quizResults'] as const
  const tx = db.transaction(stores, 'readwrite')
  for (const name of stores) {
    let cursor = await tx.objectStore(name).index('byChild').openCursor(childId)
    while (cursor) {
      await cursor.delete()
      cursor = await cursor.continue()
    }
  }
  await tx.done
}
