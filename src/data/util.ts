// 小工具：唯一 id 與本地日期字串

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8)
}

/** 本地時間的 YYYY-MM-DD */
export function todayStr(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 在某日期加上天數，回傳 YYYY-MM-DD */
export function addDaysStr(days: number, from: Date = new Date()): string {
  const d = new Date(from)
  d.setDate(d.getDate() + days)
  return todayStr(d)
}

/** 兩個 YYYY-MM-DD 相差天數（a - b） */
export function diffDays(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00')
  const db = new Date(b + 'T00:00:00')
  return Math.round((da.getTime() - db.getTime()) / 86400000)
}

export function compositeKey(childId: string, sub: string): string {
  return `${childId}__${sub}`
}
