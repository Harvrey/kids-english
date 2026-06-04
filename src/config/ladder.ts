// ============================================================================
// 學習階梯：年級 ↔ CEFR ↔ 內部關卡 ↔ 星球/星系（小一到高三）
// ⚠️ 字彙數字尚待逐條回查《十二年國教英語文領綱》原文，先標註不可作官方依據。
// ============================================================================

import type { CEFR } from '../types/content'

export interface GalaxyDef {
  key: 'nova' | 'drift' | 'pulse' | 'quasar'
  name: string
  emoji: string
  colorClass: string // tailwind 色票
}

export const GALAXIES: GalaxyDef[] = [
  { key: 'nova', name: 'Nova 新星系', emoji: '🟢', colorClass: 'text-nova' },
  { key: 'drift', name: 'Drift 漂流星系', emoji: '🔵', colorClass: 'text-drift' },
  { key: 'pulse', name: 'Pulse 脈衝星系', emoji: '🟣', colorClass: 'text-pulse' },
  { key: 'quasar', name: 'Quasar 類星系', emoji: '🟠', colorClass: 'text-quasar' },
]

export interface PlanetDef {
  grade: number // 1=小一 ... 12=高三
  gradeLabel: string
  stage: string
  cefr: CEFR
  level: string // L01..L12
  planet: string
  planetName: string
  galaxy: GalaxyDef['key']
}

export const LADDER: PlanetDef[] = [
  { grade: 1, gradeLabel: '小一', stage: '階段Ⅰ（校訂）', cefr: 'pre-A1', level: 'L01', planet: '🌱', planetName: '苗苗星', galaxy: 'nova' },
  { grade: 2, gradeLabel: '小二', stage: '階段Ⅰ（校訂）', cefr: 'pre-A1', level: 'L02', planet: '🐚', planetName: '貝殼星', galaxy: 'nova' },
  { grade: 3, gradeLabel: '小三', stage: '階段Ⅱ（正式起點）', cefr: 'A1', level: 'L03', planet: '🍃', planetName: '微風星', galaxy: 'nova' },
  { grade: 4, gradeLabel: '小四', stage: '階段Ⅱ', cefr: 'A1', level: 'L04', planet: '🔥', planetName: '火花星', galaxy: 'drift' },
  { grade: 5, gradeLabel: '小五', stage: '階段Ⅲ', cefr: 'A2', level: 'L05', planet: '💎', planetName: '水晶星', galaxy: 'drift' },
  { grade: 6, gradeLabel: '小六', stage: '階段Ⅲ', cefr: 'A2', level: 'L06', planet: '🌊', planetName: '潮汐星', galaxy: 'drift' },
  { grade: 7, gradeLabel: '國一', stage: '階段Ⅳ', cefr: 'A2', level: 'L07', planet: '⚡', planetName: '雷霆星', galaxy: 'pulse' },
  { grade: 8, gradeLabel: '國二', stage: '階段Ⅳ', cefr: 'A2', level: 'L08', planet: '🌋', planetName: '熔岩星', galaxy: 'pulse' },
  { grade: 9, gradeLabel: '國三', stage: '階段Ⅳ', cefr: 'A2', level: 'L09', planet: '❄️', planetName: '極光星', galaxy: 'pulse' },
  { grade: 10, gradeLabel: '高一', stage: '階段Ⅴ', cefr: 'B1', level: 'L10', planet: '🪐', planetName: '環帶星', galaxy: 'quasar' },
  { grade: 11, gradeLabel: '高二', stage: '階段Ⅴ', cefr: 'B1', level: 'L11', planet: '☄️', planetName: '彗核星', galaxy: 'quasar' },
  { grade: 12, gradeLabel: '高三', stage: '階段Ⅴ', cefr: 'B1', level: 'L12', planet: '🌌', planetName: '銀河中心', galaxy: 'quasar' },
]

export function planetForGrade(grade: number): PlanetDef | undefined {
  return LADDER.find((p) => p.grade === grade)
}

export function galaxyDef(key: GalaxyDef['key']): GalaxyDef {
  return GALAXIES.find((g) => g.key === key)!
}

/** 由年級推年齡分層 */
export function ageTierForGrade(grade: number): 'low' | 'mid' | 'teen' {
  if (grade <= 2) return 'low'
  if (grade <= 6) return 'mid'
  return 'teen'
}
