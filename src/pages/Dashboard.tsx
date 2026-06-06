import { useEffect, useState } from 'react'
import { useApp } from '../state/AppContext'
import { Screen, Card, Button, StarRow, Pill } from '../components/ui'
import { Hud } from '../components/Hud'
import { loadManifest, loadLesson } from '../content/contentLoader'
import type { ContentManifest, UnitRef } from '../types/content'
import { getDueCards } from '../data/srsRepository'
import { galaxyDef, galaxyForGrade, stageForGrade, STAGES, type StageDef } from '../config/ladder'
import { BADGES, badgeDef } from '../config/badges'
import { isInCooldown } from '../game/promotion'

interface LessonMeta { file: string; id: string; title: string; titleEn?: string; minutes: number }
interface UnitView { unit: UnitRef; lessons: LessonMeta[] }
interface StageView { stage: StageDef; unlocked: boolean; units: UnitView[] }

export function Dashboard() {
  const { activeChild, points, lessonProgress, unitProgress, navigate, exitChild } = useApp()
  const [stages, setStages] = useState<StageView[]>([])
  const [dueCount, setDueCount] = useState(0)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!activeChild) return
    let alive = true
    ;(async () => {
      try {
        const manifest: ContentManifest = await loadManifest()

        // 依階級分組（同階級的課程一起解鎖、可任意選）
        const byStage = new Map<string, UnitRef[]>()
        for (const u of manifest.units) {
          const key = stageForGrade(u.grade)
          if (!byStage.has(key)) byStage.set(key, [])
          byStage.get(key)!.push(u)
        }
        const present = STAGES.filter((s) => byStage.has(s.key))
        const stageCleared = (key: string) =>
          (byStage.get(key) ?? []).every((u) => unitProgress[u.id]?.promotionPassed)

        const out: StageView[] = []
        let prevCleared = true // 第一個有內容的階級預設開放
        for (let i = 0; i < present.length; i++) {
          const s = present[i]
          const unlocked = i === 0 || prevCleared
          const refs = byStage.get(s.key)!
          const units: UnitView[] = []
          for (const u of refs) {
            let lessons: LessonMeta[] = []
            if (unlocked) {
              lessons = await Promise.all(u.lessonFiles.map(async (file) => {
                const l = await loadLesson(file)
                return { file, id: l.id, title: l.title, titleEn: l.titleEn, minutes: l.estMinutes }
              }))
            }
            units.push({ unit: u, lessons })
          }
          out.push({ stage: s, unlocked, units })
          prevCleared = unlocked && stageCleared(s.key) // 下一階級：本階級已解鎖且全部晉級才開
        }

        const due = await getDueCards(activeChild.id, 99)
        if (alive) { setStages(out); setDueCount(due.length) }
      } catch (e) {
        if (alive) setErr(e instanceof Error ? e.message : '載入失敗')
      }
    })()
    return () => { alive = false }
  }, [activeChild, unitProgress])

  if (!activeChild || !points) return null

  return (
    <Screen>
      <Hud child={activeChild} points={points} onProfile={exitChild} />

      <div className="mb-4 grid grid-cols-3 gap-2">
        <Card className="p-3 text-center" onClick={() => navigate({ name: 'srs' })}>
          <div className="text-2xl">🔁</div>
          <div className="text-xs font-semibold">今日複習{dueCount > 0 && <Pill className="ml-1 bg-quasar/30 text-quasar">{dueCount}</Pill>}</div>
        </Card>
        <Card className="p-3 text-center" onClick={() => navigate({ name: 'shop' })}>
          <div className="text-2xl">🛒</div>
          <div className="text-xs font-semibold">商店</div>
        </Card>
        <Card className="p-3 text-center" onClick={() => navigate({ name: 'settings' })}>
          <div className="text-2xl">⚙️</div>
          <div className="text-xs font-semibold">設定</div>
        </Card>
      </div>

      <BadgeStrip earned={points.badges} />

      {err && <Card className="mb-4 p-4 text-center text-quasar">⚠️ {err}</Card>}

      <h2 className="mb-3 mt-2 text-lg font-bold">🗺️ 星河地圖</h2>
      <div className="space-y-6">
        {stages.map((sv) => {
          const g = galaxyDef(sv.stage.galaxy)
          return (
            <div key={sv.stage.key}>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{g.emoji}</span>
                  <div>
                    <div className={`font-bold ${g.colorClass}`}>{sv.stage.name}</div>
                    <div className="text-xs text-white/50">{sv.stage.grades} · CEFR {sv.stage.cefr}</div>
                  </div>
                </div>
                {!sv.unlocked && <span className="text-sm text-white/40">🔒 鎖定中</span>}
              </div>

              {sv.unlocked ? (
                <div className="space-y-4">
                  {sv.units.map((uv) => (
                    <UnitCard key={uv.unit.id} uv={uv} unit={uv.unit}
                      promotionPassed={!!unitProgress[uv.unit.id]?.promotionPassed}
                      cooldownUntil={unitProgress[uv.unit.id]?.cooldownUntil ?? 0}
                      onLesson={(file) => navigate({ name: 'lesson', unitId: uv.unit.id, lessonFile: file })}
                      onReview={() => uv.unit.reviewFile && navigate({ name: 'quiz', unitId: uv.unit.id, quizFile: uv.unit.reviewFile, kind: 'review' })}
                      onPromotion={() => uv.unit.promotionFile && navigate({ name: 'quiz', unitId: uv.unit.id, quizFile: uv.unit.promotionFile, kind: 'promotion' })}
                      lessonProgress={lessonProgress} />
                  ))}
                </div>
              ) : (
                <Card className="p-4 text-center text-white/50">🔒 通過「上一階級」的全部晉級測驗即可解鎖這個階級</Card>
              )}
            </div>
          )
        })}
      </div>
    </Screen>
  )
}

function BadgeStrip({ earned }: { earned: string[] }) {
  return (
    <Card className="mb-4 p-3">
      <div className="mb-1 text-xs text-white/50">我的徽章 {earned.length}/{BADGES.length}</div>
      <div className="flex flex-wrap gap-2 text-2xl">
        {BADGES.map((b) => {
          const has = earned.includes(b.id)
          return <span key={b.id} title={`${b.name}：${b.desc}`} className={has ? '' : 'opacity-20 grayscale'}>{badgeDef(b.id)?.emoji}</span>
        })}
      </div>
    </Card>
  )
}

function UnitCard({
  uv, unit, lessonProgress, promotionPassed, cooldownUntil, onLesson, onReview, onPromotion,
}: {
  uv: UnitView
  unit: UnitRef
  lessonProgress: Record<string, { stars: number; completed: boolean }>
  promotionPassed: boolean
  cooldownUntil: number
  onLesson: (file: string) => void
  onReview: () => void
  onPromotion: () => void
}) {
  const g = galaxyDef(galaxyForGrade(unit.grade))
  const totalStars = uv.lessons.reduce((s, l) => s + (lessonProgress[l.id]?.stars ?? 0), 0)
  const maxStars = uv.lessons.length * 3
  const allDone = uv.lessons.length > 0 && uv.lessons.every((l) => lessonProgress[l.id]?.completed)
  const anyDone = uv.lessons.some((l) => lessonProgress[l.id]?.completed)
  const cooling = isInCooldown(cooldownUntil)

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-4xl">{unit.planetEmoji}</span>
          <div>
            <div className="font-bold">{unit.title}</div>
            <div className={`text-xs ${g.colorClass}`}>{unit.cefr}{promotionPassed && ' · ✅ 已晉級'}</div>
          </div>
        </div>
        {uv.lessons.length > 0 && (
          <div className="text-right text-sm text-star">⭐ {totalStars}/{maxStars}</div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {uv.lessons.map((l, idx) => {
          const p = lessonProgress[l.id]
          return (
            <button key={l.id} onClick={() => onLesson(l.file)}
              className="no-select flex w-[88px] flex-col items-center gap-1 active:scale-95 transition">
              <span className={`grid h-16 w-16 place-items-center rounded-full text-2xl font-extrabold ring-4 ${p?.completed ? 'bg-nova/30 ring-nova' : 'bg-white/10 ring-white/15'}`}>
                {p?.completed ? '✓' : idx + 1}
              </span>
              <StarRow count={p?.stars ?? 0} size="text-xs" />
              <span className="text-center text-[11px] leading-tight text-white/70">{l.title}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {unit.reviewFile && <Button variant="ghost" onClick={onReview} disabled={!anyDone} className="text-base">📚 單元複習</Button>}
        {unit.promotionFile && (
          <Button variant={allDone && !cooling ? 'star' : 'ghost'} onClick={onPromotion} disabled={!allDone || cooling} className="text-base">
            🛸 晉級測驗 {promotionPassed ? '（已通過）' : ''}
          </Button>
        )}
      </div>
      {!allDone && unit.promotionFile && <p className="mt-2 text-xs text-white/40">完成本單元全部課程後即可挑戰晉級測驗</p>}
      {cooling && <p className="mt-2 text-xs text-quasar">晉級測驗冷卻中，先去複習一下再回來吧！</p>}
    </Card>
  )
}
