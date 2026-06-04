import { getDB } from './db'
import { compositeKey, todayStr } from './util'
import type { SrsCard } from '../types/profile'
import type { VocabItem } from '../types/content'

export async function listSrsCards(childId: string): Promise<SrsCard[]> {
  const db = await getDB()
  return db.getAllFromIndex('srsCards', 'byChild', childId)
}

export async function getDueCards(childId: string, limit: number, today = todayStr()): Promise<SrsCard[]> {
  const all = await listSrsCards(childId)
  return all
    .filter((c) => c.dueDate <= today)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, limit)
}

export async function saveCard(card: SrsCard): Promise<void> {
  const db = await getDB()
  await db.put('srsCards', { ...card, updatedAt: Date.now() })
}

/** 為一課的單字建立 SRS 卡（已存在則略過），新卡今天就到期可複習 */
export async function ensureCardsForVocab(childId: string, vocab: VocabItem[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('srsCards', 'readwrite')
  const today = todayStr()
  for (const v of vocab) {
    const id = compositeKey(childId, v.word)
    const existing = await tx.store.get(id)
    if (!existing) {
      const card: SrsCard = {
        id,
        childId,
        wordId: v.word,
        word: v.word,
        zh: v.zh,
        emoji: v.emoji,
        ease: 2.5,
        intervalDays: 0,
        dueDate: today,
        reps: 0,
        lapses: 0,
        updatedAt: Date.now(),
      }
      await tx.store.put(card)
    }
  }
  await tx.done
}

export async function countMastered(childId: string, minReps = 2): Promise<number> {
  const all = await listSrsCards(childId)
  return all.filter((c) => c.reps >= minReps).length
}
