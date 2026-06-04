#!/usr/bin/env node
// ============================================================================
// 課程內容驗證：逐型檢查 lesson / quiz JSON，並檢查 audio/image 資產是否存在。
// 用法：npm run validate-content
// ============================================================================

import { readFile, access } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CONTENT_DIR = join(__dirname, '..', 'public', 'content')
const PUBLIC_DIR = join(__dirname, '..', 'public')

let errors = 0
let warnings = 0
const err = (m) => { errors++; console.error('  ✗ ' + m) }
const warn = (m) => { warnings++; console.warn('  ⚠ ' + m) }

async function exists(p) {
  try { await access(p); return true } catch { return false }
}

async function readJson(rel) {
  const full = join(CONTENT_DIR, rel)
  const text = await readFile(full, 'utf8')
  return JSON.parse(text)
}

const SKILLS = ['listening', 'speaking', 'reading', 'writing']
const PHASES = ['guided', 'independent', 'check']

async function checkAsset(field, value, ctx) {
  if (!value) return
  const full = join(PUBLIC_DIR, value.replace(/^\//, ''))
  if (!(await exists(full))) err(`${ctx}: 找不到 ${field} 檔案 → ${value}`)
}

async function validateExercise(ex, ctx) {
  if (!ex.id) err(`${ctx}: 缺 id`)
  if (!ex.type) { err(`${ctx}: 缺 type`); return }
  if (!SKILLS.includes(ex.skill)) err(`${ctx}(${ex.id}): skill 不合法 → ${ex.skill}`)
  if (!PHASES.includes(ex.phase)) err(`${ctx}(${ex.id}): phase 不合法 → ${ex.phase}`)
  if (typeof ex.points !== 'number') warn(`${ctx}(${ex.id}): points 非數字`)

  switch (ex.type) {
    case 'mcq':
    case 'listen-choose': {
      if (!Array.isArray(ex.options) || ex.options.length < 2) err(`${ctx}(${ex.id}): options 至少 2 個`)
      if (!ex.options?.some((o) => o.id === ex.answerId)) err(`${ctx}(${ex.id}): answerId 不在 options 中`)
      if (ex.type === 'listen-choose' && !ex.audioText) err(`${ctx}(${ex.id}): listen-choose 缺 audioText`)
      for (const o of ex.options ?? []) await checkAsset('image', o.image, `${ctx}(${ex.id})`)
      break
    }
    case 'matching': {
      if (!Array.isArray(ex.pairs) || ex.pairs.length < 2) err(`${ctx}(${ex.id}): pairs 至少 2 組`)
      for (const p of ex.pairs ?? []) {
        if (!p.id) err(`${ctx}(${ex.id}): pair 缺 id`)
        if (!p.left || !p.right) err(`${ctx}(${ex.id}): pair 缺 left/right`)
      }
      break
    }
    case 'fill-in': {
      if (!ex.prompt) err(`${ctx}(${ex.id}): 缺 prompt`)
      if (!Array.isArray(ex.acceptableAnswers) || !ex.acceptableAnswers.length) err(`${ctx}(${ex.id}): 缺 acceptableAnswers`)
      break
    }
    case 'ordering': {
      if (!Array.isArray(ex.tokens) || ex.tokens.length < 2) err(`${ctx}(${ex.id}): tokens 至少 2 個`)
      break
    }
    case 'spelling': {
      if (!ex.word) err(`${ctx}(${ex.id}): 缺 word`)
      if (!['type', 'tiles'].includes(ex.mode)) err(`${ctx}(${ex.id}): mode 必須 type/tiles`)
      break
    }
    case 'speak': {
      if (!ex.target) err(`${ctx}(${ex.id}): 缺 target`)
      if (!['repeat-required', 'free-bonus'].includes(ex.mode)) err(`${ctx}(${ex.id}): mode 不合法`)
      break
    }
    case 'reading': {
      if (!ex.passage) err(`${ctx}(${ex.id}): 缺 passage`)
      if (!Array.isArray(ex.questions) || !ex.questions.length) err(`${ctx}(${ex.id}): 缺 questions`)
      for (const q of ex.questions ?? []) {
        if (!q.options?.some((o) => o.id === q.answerId)) err(`${ctx}(${ex.id}/${q.id}): answerId 不在 options`)
      }
      break
    }
    default:
      err(`${ctx}(${ex.id}): 未知題型 type → ${ex.type}`)
  }
}

async function validateLesson(file) {
  console.log(`• 課程 ${file}`)
  const l = await readJson(file)
  for (const f of ['id', 'unitId', 'title', 'grade', 'cefr', 'ageTier']) {
    if (l[f] === undefined) err(`${file}: 缺欄位 ${f}`)
  }
  if (!Array.isArray(l.exercises) || !l.exercises.length) err(`${file}: 缺 exercises`)
  for (const v of l.vocabulary ?? []) {
    await checkAsset('image', v.image, file)
    await checkAsset('audio', v.audio, file)
  }
  for (const ex of l.exercises ?? []) await validateExercise(ex, file)
  if (!l.exercises?.some((e) => e.phase === 'check')) warn(`${file}: 沒有 check 階段題目（無法評星）`)
}

async function validateQuiz(file) {
  console.log(`• 測驗 ${file}`)
  const q = await readJson(file)
  if (!['review', 'promotion'].includes(q.kind)) err(`${file}: kind 必須 review/promotion`)
  if (typeof q.passThreshold !== 'number') err(`${file}: 缺 passThreshold`)
  if (!Array.isArray(q.items) || !q.items.length) err(`${file}: 缺 items`)
  for (const ex of q.items ?? []) await validateExercise(ex, file)
}

async function main() {
  console.log('🔍 驗證課程內容…\n')
  const manifest = await readJson('manifest.json')
  if (!Array.isArray(manifest.units)) { err('manifest.json 缺 units'); }
  const ids = new Set()
  for (const u of manifest.units ?? []) {
    if (ids.has(u.id)) err(`manifest: 重複 unit id → ${u.id}`)
    ids.add(u.id)
    for (const f of u.lessonFiles ?? []) await validateLesson(f)
    if (u.reviewFile) await validateQuiz(u.reviewFile)
    if (u.promotionFile) await validateQuiz(u.promotionFile)
  }

  console.log('')
  if (errors) {
    console.error(`❌ 驗證失敗：${errors} 個錯誤、${warnings} 個警告`)
    process.exit(1)
  }
  console.log(`✅ 驗證通過（${warnings} 個警告）`)
}

main().catch((e) => { console.error(e); process.exit(1) })
