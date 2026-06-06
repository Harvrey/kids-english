// ============================================================================
// 內容載入器：從 public/content 抓取 manifest / 課程 / 測驗（含快取）。
// 課程內容與程式分離 → 新增一課只要新增 JSON 並登錄到 manifest。
// ============================================================================

import type { ContentManifest, Lesson, QuizDef, ReadersManifest, Reader } from '../types/content'

const BASE = import.meta.env.BASE_URL // 結尾必為 '/'

function contentUrl(path: string): string {
  return `${BASE}content/${path}`
}

let manifestCache: ContentManifest | null = null
const lessonCache = new Map<string, Lesson>()
const quizCache = new Map<string, QuizDef>()

export async function loadManifest(): Promise<ContentManifest> {
  if (manifestCache) return manifestCache
  const res = await fetch(contentUrl('manifest.json'))
  if (!res.ok) throw new Error('無法載入課程清單 manifest.json')
  manifestCache = (await res.json()) as ContentManifest
  return manifestCache
}

export async function loadLesson(file: string): Promise<Lesson> {
  const cached = lessonCache.get(file)
  if (cached) return cached
  const res = await fetch(contentUrl(file))
  if (!res.ok) throw new Error('無法載入課程：' + file)
  const lesson = (await res.json()) as Lesson
  lessonCache.set(file, lesson)
  return lesson
}

export async function loadQuiz(file: string): Promise<QuizDef> {
  const cached = quizCache.get(file)
  if (cached) return cached
  const res = await fetch(contentUrl(file))
  if (!res.ok) throw new Error('無法載入測驗：' + file)
  const quiz = (await res.json()) as QuizDef
  quizCache.set(file, quiz)
  return quiz
}

let readersCache: ReadersManifest | null = null
const readerCache = new Map<string, Reader>()

export async function loadReadersManifest(): Promise<ReadersManifest> {
  if (readersCache) return readersCache
  const res = await fetch(contentUrl('readers.json'))
  if (!res.ok) throw new Error('無法載入閱讀樂園清單 readers.json')
  readersCache = (await res.json()) as ReadersManifest
  return readersCache
}

export async function loadReader(file: string): Promise<Reader> {
  const cached = readerCache.get(file)
  if (cached) return cached
  const res = await fetch(contentUrl(file))
  if (!res.ok) throw new Error('無法載入讀本：' + file)
  const reader = (await res.json()) as Reader
  readerCache.set(file, reader)
  return reader
}
