// ============================================================================
// 點數運算（純函式）：XP、金幣、連續天數、商店、徽章
// ============================================================================

import type { PointsState } from '../types/profile'
import type { ShopItem } from '../config/shop'
import { todayStr, diffDays } from '../data/util'

export function addXp(p: PointsState, amount: number): PointsState {
  return { ...p, xp: p.xp + Math.max(0, Math.round(amount)) }
}

export function addCoins(p: PointsState, amount: number): PointsState {
  return { ...p, coins: Math.max(0, p.coins + Math.round(amount)) }
}

export function addStars(p: PointsState, stars: number): PointsState {
  return { ...p, totalStars: p.totalStars + Math.max(0, stars) }
}

/** 更新連續學習天數（今天已記錄則不變） */
export function applyStreak(p: PointsState, today = todayStr()): { points: PointsState; increased: boolean } {
  if (p.lastActiveDate === today) return { points: p, increased: false }
  const gap = diffDays(today, p.lastActiveDate)
  let streak = 1
  if (gap === 1) streak = p.streakDays + 1
  // gap <=0（時鐘異常）或 >1（中斷）→ 重新從 1 起算
  return { points: { ...p, streakDays: streak, lastActiveDate: today }, increased: true }
}

export function buyItem(p: PointsState, item: ShopItem): { ok: boolean; points: PointsState; reason?: string } {
  if (p.ownedItems.includes(item.id)) return { ok: false, points: p, reason: '已經擁有囉' }
  if (p.coins < item.price) return { ok: false, points: p, reason: '金幣不夠，再多學幾課！' }
  return {
    ok: true,
    points: { ...p, coins: p.coins - item.price, ownedItems: [...p.ownedItems, item.id] },
  }
}

export function equipAvatar(p: PointsState, itemId: string): PointsState {
  if (!p.ownedItems.includes(itemId)) return p
  return { ...p, equippedAvatar: itemId }
}

export interface BadgeStats {
  lessonsCompleted: number
  hasThreeStar: boolean
  streakDays: number
  reviewPassed: boolean
  promotionPassed: boolean
  masteredWords: number
  speakCount: number
}

/** 依統計頒發未擁有的徽章，回傳新狀態與新得徽章 id */
export function evaluateBadges(p: PointsState, s: BadgeStats): { points: PointsState; newBadges: string[] } {
  const earned = new Set(p.badges)
  const add = (id: string, cond: boolean) => {
    if (cond && !earned.has(id)) earned.add(id)
  }
  add('first-lesson', s.lessonsCompleted >= 1)
  add('three-star', s.hasThreeStar)
  add('five-lessons', s.lessonsCompleted >= 5)
  add('streak-3', s.streakDays >= 3)
  add('streak-7', s.streakDays >= 7)
  add('review-pass', s.reviewPassed)
  add('promotion-pass', s.promotionPassed)
  add('word-collector-20', s.masteredWords >= 20)
  add('speaker', s.speakCount >= 10)

  const newBadges = [...earned].filter((id) => !p.badges.includes(id))
  return { points: { ...p, badges: [...earned] }, newBadges }
}
