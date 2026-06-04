// ============================================================================
// IndexedDB 設定（使用 idb）。多個小孩各自獨立命名空間（以 childId 索引）。
// ============================================================================

import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type {
  Child,
  LessonProgress,
  UnitProgress,
  PointsState,
  SrsCard,
  QuizResult,
} from '../types/profile'

interface KidsDB extends DBSchema {
  children: { key: string; value: Child }
  lessonProgress: { key: string; value: LessonProgress; indexes: { byChild: string } }
  unitProgress: { key: string; value: UnitProgress; indexes: { byChild: string } }
  points: { key: string; value: PointsState }
  srsCards: { key: string; value: SrsCard; indexes: { byChild: string } }
  quizResults: { key: string; value: QuizResult; indexes: { byChild: string } }
}

const DB_NAME = 'kids-english-db'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<KidsDB>> | null = null

export function getDB(): Promise<IDBPDatabase<KidsDB>> {
  if (!dbPromise) {
    dbPromise = openDB<KidsDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore('children', { keyPath: 'id' })

        const lp = db.createObjectStore('lessonProgress', { keyPath: 'id' })
        lp.createIndex('byChild', 'childId')

        const up = db.createObjectStore('unitProgress', { keyPath: 'id' })
        up.createIndex('byChild', 'childId')

        db.createObjectStore('points', { keyPath: 'childId' })

        const srs = db.createObjectStore('srsCards', { keyPath: 'id' })
        srs.createIndex('byChild', 'childId')

        const qr = db.createObjectStore('quizResults', { keyPath: 'id' })
        qr.createIndex('byChild', 'childId')
      },
    })
  }
  return dbPromise
}

/**
 * 嘗試請求持久化儲存，降低 iOS/Safari 自動清資料的風險。
 */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (navigator.storage && navigator.storage.persist) {
      return await navigator.storage.persist()
    }
  } catch {
    /* ignore */
  }
  return false
}
