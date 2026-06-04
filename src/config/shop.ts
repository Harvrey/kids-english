// ============================================================================
// 商店：用金幣購買頭像與裝飾（外觀純美觀，不影響學習/測驗）
// ============================================================================

export interface ShopItem {
  id: string
  name: string
  emoji: string
  price: number
  category: 'avatar' | 'decoration'
}

export const SHOP_ITEMS: ShopItem[] = [
  // 頭像（可裝備）
  { id: 'avatar-astronaut', name: '太空人', emoji: '👨‍🚀', price: 0, category: 'avatar' },
  { id: 'avatar-robot', name: '機器人', emoji: '🤖', price: 30, category: 'avatar' },
  { id: 'avatar-alien', name: '外星人', emoji: '👽', price: 40, category: 'avatar' },
  { id: 'avatar-cat', name: '太空喵', emoji: '🐱', price: 40, category: 'avatar' },
  { id: 'avatar-unicorn', name: '獨角獸', emoji: '🦄', price: 60, category: 'avatar' },
  { id: 'avatar-dragon', name: '小恐龍', emoji: '🦖', price: 60, category: 'avatar' },
  { id: 'avatar-fox', name: '小狐狸', emoji: '🦊', price: 50, category: 'avatar' },
  { id: 'avatar-owl', name: '貓頭鷹', emoji: '🦉', price: 50, category: 'avatar' },
  // 裝飾（收藏）
  { id: 'deco-rocket', name: '火箭', emoji: '🚀', price: 25, category: 'decoration' },
  { id: 'deco-planet', name: '行星', emoji: '🪐', price: 25, category: 'decoration' },
  { id: 'deco-star', name: '流星', emoji: '🌠', price: 20, category: 'decoration' },
  { id: 'deco-rainbow', name: '彩虹', emoji: '🌈', price: 35, category: 'decoration' },
  { id: 'deco-crown', name: '皇冠', emoji: '👑', price: 80, category: 'decoration' },
  { id: 'deco-medal', name: '獎牌', emoji: '🏅', price: 70, category: 'decoration' },
]

/** 預設免費頭像（建檔時自動擁有） */
export const DEFAULT_AVATAR = 'avatar-astronaut'

export function shopItem(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find((i) => i.id === id)
}
