// ============================================================================
// 徽章/成就定義
// ============================================================================

export interface BadgeDef {
  id: string
  name: string
  emoji: string
  desc: string
}

export const BADGES: BadgeDef[] = [
  { id: 'first-lesson', name: '啟航', emoji: '🚀', desc: '完成第一堂課' },
  { id: 'three-star', name: '完美星航員', emoji: '🌟', desc: '拿到第一個三星' },
  { id: 'five-lessons', name: '探索者', emoji: '🧭', desc: '完成 5 堂課' },
  { id: 'streak-3', name: '小恆星', emoji: '🔥', desc: '連續學習 3 天' },
  { id: 'streak-7', name: '不滅之火', emoji: '☀️', desc: '連續學習 7 天' },
  { id: 'review-pass', name: '複習達人', emoji: '📚', desc: '通過一次單元複習' },
  { id: 'promotion-pass', name: '跨星系', emoji: '🛸', desc: '通過一次晉級測驗' },
  { id: 'word-collector-20', name: '單字收藏家', emoji: '💎', desc: '熟練 20 個單字' },
  { id: 'speaker', name: '勇敢開口', emoji: '🎤', desc: '完成 10 次口說錄音' },
]

export function badgeDef(id: string): BadgeDef | undefined {
  return BADGES.find((b) => b.id === id)
}
