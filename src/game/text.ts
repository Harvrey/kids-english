// 文字正規化與容錯比對（給填空/拼字用）

export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:'"`’”“()\-_]/g, '')
    .replace(/\s+/g, ' ')
}

/** Levenshtein 編輯距離 */
export function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m
  const dp = new Array(n + 1)
  for (let j = 0; j <= n; j++) dp[j] = j
  for (let i = 1; i <= m; i++) {
    let prev = dp[0]
    dp[0] = i
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j]
      dp[j] = Math.min(
        dp[j] + 1, // 刪除
        dp[j - 1] + 1, // 插入
        prev + (a[i - 1] === b[j - 1] ? 0 : 1), // 替換
      )
      prev = tmp
    }
  }
  return dp[n]
}

/** 容錯比對：正規化後完全相等，或編輯距離 ≤ 1（字越長越寬鬆一格） */
export function fuzzyEqual(input: string, target: string, tolerant = true): boolean {
  const a = normalizeText(input)
  const b = normalizeText(target)
  if (a === b) return true
  if (!tolerant) return false
  if (b.length <= 3) return a === b // 太短不容錯
  return levenshtein(a, b) <= 1
}
