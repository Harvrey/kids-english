import { getDB } from './db'
import type { PointsState } from '../types/profile'
import { todayStr } from './util'
import { DEFAULT_AVATAR } from '../config/shop'

export async function getPoints(childId: string): Promise<PointsState> {
  const db = await getDB()
  const found = await db.get('points', childId)
  if (found) return found
  const fresh: PointsState = {
    childId,
    xp: 0,
    coins: 0,
    streakDays: 0,
    lastActiveDate: todayStr(),
    ownedItems: [DEFAULT_AVATAR],
    equippedAvatar: DEFAULT_AVATAR,
    badges: [],
    totalStars: 0,
    speakCount: 0,
    updatedAt: Date.now(),
  }
  await db.put('points', fresh)
  return fresh
}

export async function savePoints(p: PointsState): Promise<void> {
  const db = await getDB()
  await db.put('points', { ...p, updatedAt: Date.now() })
}
