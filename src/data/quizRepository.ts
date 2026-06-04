import { getDB } from './db'
import type { QuizResult } from '../types/profile'

const MAX_DETAIL_PER_CHILD = 50 // 每童僅保留最近 N 筆明細

export async function addQuizResult(result: QuizResult): Promise<void> {
  const db = await getDB()
  await db.put('quizResults', result)

  // 簡易保留策略：超過上限就刪最舊
  const all = await db.getAllFromIndex('quizResults', 'byChild', result.childId)
  if (all.length > MAX_DETAIL_PER_CHILD) {
    const sorted = all.sort((a, b) => a.createdAt - b.createdAt)
    const toDelete = sorted.slice(0, all.length - MAX_DETAIL_PER_CHILD)
    const tx = db.transaction('quizResults', 'readwrite')
    for (const r of toDelete) await tx.store.delete(r.id)
    await tx.done
  }
}

export async function listQuizResults(childId: string): Promise<QuizResult[]> {
  const db = await getDB()
  const all = await db.getAllFromIndex('quizResults', 'byChild', childId)
  return all.sort((a, b) => b.createdAt - a.createdAt)
}
