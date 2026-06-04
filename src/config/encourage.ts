// ============================================================================
// 鼓勵語（依年齡分層；拒絕懲罰、答錯也正向引導）
// ============================================================================

import type { AgeTier } from '../types/content'

type Bank = Record<AgeTier, string[]>

const CORRECT: Bank = {
  low: ['太棒了！🎉', '答對囉！⭐', '好厲害！👏', '哇～你好強！🌟'],
  mid: ['答對了！👍', '做得好！🎯', '太準了！✨', '繼續保持！🚀'],
  teen: ['Correct! 👍', '答對，節奏很穩。', 'Nice！繼續。', '掌握得不錯。'],
}

const WRONG: Bank = {
  low: ['沒關係，再試一次！💪', '快接近了喔～', '我們一起再看一次！👀', '不怕，再來！🌈'],
  mid: ['差一點，再想想！', '沒關係，看一下提示～', '再試一次就會了！', '錯了也有分，加油！'],
  teen: ['再看一次線索。', '接近了，調整一下。', '沒關係，這題偏難。', '把它記下來，等等會複習。'],
}

const COMPLETE: Bank = {
  low: ['你完成這一課了！好棒！🎊', '星航員任務完成！🚀', '今天學得好開心！🌟'],
  mid: ['這一課完成！收下你的星星 ⭐', '任務達成，前往下一站！🪐', '進步看得見，讚！👏'],
  teen: ['本課完成，數據已更新。', '不錯，繼續往下一關。', 'Lesson cleared. 👏'],
}

const REST: Bank = {
  low: ['今天做得很好，休息一下吧！😊', '眼睛要休息囉，明天再來玩！🌙'],
  mid: ['今天表現很棒，休息一下！', '學夠久了，去動一動吧！'],
  teen: ['今天進度足夠了，適度休息。', '休息也是學習的一部分。'],
}

function pick(arr: string[], seed: number): string {
  return arr[Math.abs(seed) % arr.length]
}

export function encourageCorrect(tier: AgeTier, seed: number) {
  return pick(CORRECT[tier], seed)
}
export function encourageWrong(tier: AgeTier, seed: number) {
  return pick(WRONG[tier], seed)
}
export function encourageComplete(tier: AgeTier, seed: number) {
  return pick(COMPLETE[tier], seed)
}
export function encourageRest(tier: AgeTier, seed: number) {
  return pick(REST[tier], seed)
}
