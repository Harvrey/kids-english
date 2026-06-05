// ============================================================================
// 學習階梯：對齊 english-course-spec.md 的「5 階段 × 12 年」模型
// 年級 ↔ 階段(S1–S5) ↔ CEFR ↔ 星球/星系。
// ⚠️ 字彙數字仍待回查領綱，僅供參考。
// ============================================================================

import type { CEFR } from '../types/content'

export type StageKey = 'S1' | 'S2' | 'S3' | 'S4' | 'S5'

export interface StageDef {
  key: StageKey
  name: string          // 規格階段名
  grades: string        // 年級範圍
  cefr: string          // CEFR 目標
  vocab: string         // 累積字彙錨點
  galaxy: GalaxyDef['key']
}

export interface GalaxyDef {
  key: 'nova' | 'drift' | 'pulse' | 'quasar' | 'nebula'
  name: string
  emoji: string
  colorClass: string
}

export const GALAXIES: GalaxyDef[] = [
  { key: 'nova', name: 'Nova 新星系', emoji: '🟢', colorClass: 'text-nova' },
  { key: 'drift', name: 'Drift 漂流星系', emoji: '🔵', colorClass: 'text-drift' },
  { key: 'pulse', name: 'Pulse 脈衝星系', emoji: '🟣', colorClass: 'text-pulse' },
  { key: 'quasar', name: 'Quasar 類星系', emoji: '🟠', colorClass: 'text-quasar' },
  { key: 'nebula', name: 'Nebula 星雲', emoji: '🩷', colorClass: 'text-nebula' },
]

export const STAGES: StageDef[] = [
  { key: 'S1', name: 'S1 啟蒙奠基', grades: 'G1–G2', cefr: 'Pre-A1→A1', vocab: '150–300', galaxy: 'nova' },
  { key: 'S2', name: 'S2 讀寫起步', grades: 'G3–G4', cefr: 'A1', vocab: '500–800', galaxy: 'drift' },
  { key: 'S3', name: 'S3 四技均衡', grades: 'G5–G6', cefr: 'A1+→A2', vocab: '1,000–1,200', galaxy: 'pulse' },
  { key: 'S4', name: 'S4 進階整合', grades: 'G7–G9', cefr: 'A2→B1', vocab: '~2,000', galaxy: 'quasar' },
  { key: 'S5', name: 'S5 學術精熟', grades: 'G10–G12', cefr: 'B1→B2', vocab: '4,500–6,000', galaxy: 'nebula' },
]

export interface PlanetDef {
  grade: number
  gradeLabel: string
  stageKey: StageKey
  stage: string
  cefr: CEFR
  level: string
  planet: string
  planetName: string
  galaxy: GalaxyDef['key']
}

export const LADDER: PlanetDef[] = [
  { grade: 1, gradeLabel: '小一', stageKey: 'S1', stage: 'S1 啟蒙奠基', cefr: 'pre-A1', level: 'L01', planet: '🌱', planetName: '苗苗星', galaxy: 'nova' },
  { grade: 2, gradeLabel: '小二', stageKey: 'S1', stage: 'S1 啟蒙奠基', cefr: 'pre-A1', level: 'L02', planet: '🐚', planetName: '貝殼星', galaxy: 'nova' },
  { grade: 3, gradeLabel: '小三', stageKey: 'S2', stage: 'S2 讀寫起步', cefr: 'A1', level: 'L03', planet: '🍃', planetName: '微風星', galaxy: 'drift' },
  { grade: 4, gradeLabel: '小四', stageKey: 'S2', stage: 'S2 讀寫起步', cefr: 'A1', level: 'L04', planet: '🔥', planetName: '火花星', galaxy: 'drift' },
  { grade: 5, gradeLabel: '小五', stageKey: 'S3', stage: 'S3 四技均衡', cefr: 'A2', level: 'L05', planet: '💎', planetName: '水晶星', galaxy: 'pulse' },
  { grade: 6, gradeLabel: '小六', stageKey: 'S3', stage: 'S3 四技均衡', cefr: 'A2', level: 'L06', planet: '🌊', planetName: '潮汐星', galaxy: 'pulse' },
  { grade: 7, gradeLabel: '國一', stageKey: 'S4', stage: 'S4 進階整合', cefr: 'A2', level: 'L07', planet: '⚡', planetName: '雷霆星', galaxy: 'quasar' },
  { grade: 8, gradeLabel: '國二', stageKey: 'S4', stage: 'S4 進階整合', cefr: 'B1', level: 'L08', planet: '🌋', planetName: '熔岩星', galaxy: 'quasar' },
  { grade: 9, gradeLabel: '國三', stageKey: 'S4', stage: 'S4 進階整合', cefr: 'B1', level: 'L09', planet: '❄️', planetName: '極光星', galaxy: 'quasar' },
  { grade: 10, gradeLabel: '高一', stageKey: 'S5', stage: 'S5 學術精熟', cefr: 'B1', level: 'L10', planet: '🪐', planetName: '環帶星', galaxy: 'nebula' },
  { grade: 11, gradeLabel: '高二', stageKey: 'S5', stage: 'S5 學術精熟', cefr: 'B2', level: 'L11', planet: '☄️', planetName: '彗核星', galaxy: 'nebula' },
  { grade: 12, gradeLabel: '高三', stageKey: 'S5', stage: 'S5 學術精熟', cefr: 'B2', level: 'L12', planet: '🌌', planetName: '銀河中心', galaxy: 'nebula' },
]

export function planetForGrade(grade: number): PlanetDef | undefined {
  return LADDER.find((p) => p.grade === grade)
}

export function galaxyDef(key: GalaxyDef['key']): GalaxyDef {
  return GALAXIES.find((g) => g.key === key) ?? GALAXIES[0]
}

export function stageForGrade(grade: number): StageKey {
  if (grade <= 2) return 'S1'
  if (grade <= 4) return 'S2'
  if (grade <= 6) return 'S3'
  if (grade <= 9) return 'S4'
  return 'S5'
}

export function galaxyForGrade(grade: number): GalaxyDef['key'] {
  return planetForGrade(grade)?.galaxy ?? 'nova'
}

/** 由年級推年齡分層（呈現用） */
export function ageTierForGrade(grade: number): 'low' | 'mid' | 'teen' {
  if (grade <= 2) return 'low'
  if (grade <= 6) return 'mid'
  return 'teen'
}
