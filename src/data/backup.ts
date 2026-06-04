// ============================================================================
// 備份：匯出整個 DB 成單一 JSON；匯入只提供「覆蓋還原」（非多裝置即時同步）。
// ============================================================================

import { getDB } from './db'
import type { BackupBundle } from '../types/profile'

const BACKUP_SCHEMA = 1

export async function exportAll(): Promise<BackupBundle> {
  const db = await getDB()
  const [children, lessonProgress, unitProgress, points, srsCards, quizResults] = await Promise.all([
    db.getAll('children'),
    db.getAll('lessonProgress'),
    db.getAll('unitProgress'),
    db.getAll('points'),
    db.getAll('srsCards'),
    db.getAll('quizResults'),
  ])
  return {
    schemaVersion: BACKUP_SCHEMA,
    exportedAt: Date.now(),
    children,
    lessonProgress,
    unitProgress,
    points,
    srsCards,
    quizResults,
  }
}

export async function downloadBackup(): Promise<void> {
  const bundle = await exportAll()
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `星河探險-備份-${stamp}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/** 覆蓋還原：清空所有 store 後寫入備份內容 */
export async function importOverwrite(bundle: BackupBundle): Promise<void> {
  if (!bundle || typeof bundle !== 'object' || !Array.isArray(bundle.children)) {
    throw new Error('備份檔格式不正確')
  }
  const db = await getDB()
  const stores = ['children', 'lessonProgress', 'unitProgress', 'points', 'srsCards', 'quizResults'] as const
  const tx = db.transaction(stores, 'readwrite')
  await Promise.all(stores.map((s) => tx.objectStore(s).clear()))
  for (const c of bundle.children) await tx.objectStore('children').put(c)
  for (const x of bundle.lessonProgress ?? []) await tx.objectStore('lessonProgress').put(x)
  for (const x of bundle.unitProgress ?? []) await tx.objectStore('unitProgress').put(x)
  for (const x of bundle.points ?? []) await tx.objectStore('points').put(x)
  for (const x of bundle.srsCards ?? []) await tx.objectStore('srsCards').put(x)
  for (const x of bundle.quizResults ?? []) await tx.objectStore('quizResults').put(x)
  await tx.done
}

export async function readBackupFile(file: File): Promise<BackupBundle> {
  const text = await file.text()
  return JSON.parse(text) as BackupBundle
}
