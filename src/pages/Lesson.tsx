import { useEffect, useRef, useState } from 'react'
import { useApp } from '../state/AppContext'
import { Screen, Card, Button, StarRow, AudioButton } from '../components/ui'
import { SrsReview } from '../components/SrsReview'
import { ExerciseView } from '../components/ExerciseView'
import { loadLesson, loadManifest } from '../content/contentLoader'
import type { Lesson as LessonT, Exercise, TeachingCard } from '../types/content'
import type { SrsCard } from '../types/profile'
import { getDueCards } from '../data/srsRepository'
import { saveCard } from '../data/srsRepository'
import { reviewCard, type Recall } from '../game/srs'
import { finishLesson, type LessonSummary } from '../game/sessionFlow'
import { XP_RULES } from '../config/levels'
import { encourageComplete } from '../config/encourage'
import { badgeDef } from '../config/badges'
import { play } from '../audio/tts'

type Stage = 'loading' | 'warmup' | 'learn' | 'exercise' | 'saving' | 'reward'
const PHASE_RANK = { guided: 0, independent: 1, check: 2 } as const

export function Lesson({ unitId, lessonFile }: { unitId: string; lessonFile: string }) {
  const { activeChild, showZh, navigate, refreshActive } = useApp()
  const [stage, setStage] = useState<Stage>('loading')
  const [lesson, setLesson] = useState<LessonT | null>(null)
  const [dueCards, setDueCards] = useState<SrsCard[]>([])
  const [exIdx, setExIdx] = useState(0)
  const [summary, setSummary] = useState<LessonSummary | null>(null)
  const [nextFile, setNextFile] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const acc = useRef({ xp: 0, speak: 0, responses: {} as Record<string, unknown> })

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const l = await loadLesson(lessonFile)
        const due = activeChild ? await getDueCards(activeChild.id, 5) : []
        const manifest = await loadManifest()
        const unit = manifest.units.find((u) => u.id === unitId)
        const idx = unit?.lessonFiles.indexOf(lessonFile) ?? -1
        const next = unit && idx >= 0 && idx + 1 < unit.lessonFiles.length ? unit.lessonFiles[idx + 1] : null
        if (!alive) return
        setLesson(l)
        setDueCards(due)
        setNextFile(next)
        setStage(due.length ? 'warmup' : 'learn')
      } catch (e) {
        if (alive) setErr(e instanceof Error ? e.message : '載入失敗')
      }
    })()
    return () => { alive = false }
  }, [lessonFile, unitId, activeChild])

  if (err) return <Screen><Card className="p-6 text-center text-quasar">⚠️ {err}<div className="mt-4"><Button onClick={() => navigate({ name: 'dashboard' })}>回地圖</Button></div></Card></Screen>
  if (!lesson || !activeChild) return <Screen><div className="mt-20 text-center text-white/60">載入中…</div></Screen>

  const exercises: Exercise[] = [...lesson.exercises].sort((a, b) => PHASE_RANK[a.phase] - PHASE_RANK[b.phase])

  const onExerciseDone = async (idx: number, correct: boolean, isSpeak: boolean, response: unknown) => {
    const ex = exercises[idx]
    acc.current.responses[ex.id] = response
    acc.current.xp += XP_RULES.attempt + (correct ? XP_RULES.correct : 0)
    if (isSpeak) { acc.current.speak += 1; acc.current.xp += XP_RULES.speakBonus }
    if (idx + 1 < exercises.length) {
      setExIdx(idx + 1)
    } else {
      setStage('saving')
      const s = await finishLesson({
        child: activeChild, lesson,
        checkResponses: acc.current.responses, xpFromExercises: acc.current.xp, speakDone: acc.current.speak,
      })
      await refreshActive()
      setSummary(s)
      setStage('reward')
    }
  }

  const onSrsReview = (card: SrsCard, recall: Recall) => {
    void saveCard(reviewCard(card, recall))
  }

  const restart = () => {
    acc.current = { xp: 0, speak: 0, responses: {} }
    setExIdx(0); setSummary(null); setStage('learn')
  }

  return (
    <Screen>
      <LessonHeader title={lesson.title} stage={stage} step={exIdx + 1} total={exercises.length}
        onExit={() => navigate({ name: 'dashboard' })} />

      {stage === 'warmup' && (
        <div>
          <p className="mb-3 text-center text-white/70">先暖身複習一下之前學過的單字 🔥</p>
          <SrsReview cards={dueCards} onReview={onSrsReview} onFinish={() => setStage('learn')} />
          <div className="mt-3 text-center"><button onClick={() => setStage('learn')} className="text-sm text-white/40 underline">跳過暖身</button></div>
        </div>
      )}

      {stage === 'learn' && <LearnPhase lesson={lesson} showZh={showZh} onDone={() => setStage('exercise')} />}

      {stage === 'exercise' && (
        <ExerciseView key={exercises[exIdx].id} exercise={exercises[exIdx]} ageTier={lesson.ageTier} showZh={showZh} seed={exIdx}
          onDone={(result, response) => onExerciseDone(exIdx, result.correct, exercises[exIdx].type === 'speak', response)} />
      )}

      {stage === 'saving' && <div className="mt-20 text-center text-white/60">結算中… ✨</div>}

      {stage === 'reward' && summary && (
        <RewardPhase summary={summary} title={lesson.title} ageTier={lesson.ageTier}
          hasNext={!!nextFile}
          onMap={() => navigate({ name: 'dashboard' })}
          onRetry={restart}
          onNext={() => { if (nextFile) { restart(); navigate({ name: 'lesson', unitId, lessonFile: nextFile }) } }} />
      )}
    </Screen>
  )
}

function LessonHeader({ title, stage, step, total, onExit }: { title: string; stage: Stage; step: number; total: number; onExit: () => void }) {
  const label: Record<Stage, string> = {
    loading: '載入中', warmup: '暖身', learn: '學習新內容', exercise: `練習 ${step}/${total}`, saving: '結算', reward: '完成！',
  }
  return (
    <div className="mb-4 flex items-center gap-3">
      <button onClick={onExit} className="no-select grid h-10 w-10 place-items-center rounded-full bg-white/10 text-lg active:scale-90">✕</button>
      <div className="flex-1">
        <div className="text-sm text-white/60">{label[stage]}</div>
        <div className="truncate font-bold">{title}</div>
      </div>
    </div>
  )
}

// ---- 學習階段 ----
function LearnPhase({ lesson, showZh, onDone }: { lesson: LessonT; showZh: boolean; onDone: () => void }) {
  const [i, setI] = useState(0)
  const cards = lesson.teaching
  const card = cards[i]
  const last = i === cards.length - 1

  // 自動播放當前卡的英文
  useEffect(() => {
    const text = cardAudioText(card)
    if (text) play({ text })
  }, [i]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div className="mb-2 text-center text-xs text-white/40">{i + 1} / {cards.length}</div>
      <div className="animate-pop-in"><TeachingCardView card={card} showZh={showZh} /></div>
      <div className="mt-5 flex justify-between gap-3">
        <Button variant="ghost" disabled={i === 0} onClick={() => setI(i - 1)}>← 上一個</Button>
        {!last
          ? <Button variant="primary" onClick={() => setI(i + 1)}>下一個 →</Button>
          : <Button variant="success" onClick={onDone}>開始練習 🎯</Button>}
      </div>
    </div>
  )
}

function cardAudioText(card: TeachingCard): string | undefined {
  switch (card.kind) {
    case 'vocab': return card.vocab.word
    case 'sentence': return card.sentence.text
    case 'phonics': return card.examples.join(', ')
    case 'dialogue': return card.lines.map((l) => l.text).join('. ')
    default: return undefined
  }
}

function TeachingCardView({ card, showZh }: { card: TeachingCard; showZh: boolean }) {
  switch (card.kind) {
    case 'vocab':
      return (
        <Card className="p-8 text-center">
          <div className="text-8xl">{card.vocab.emoji ?? '🔤'}</div>
          <div className="mt-4 text-4xl font-extrabold">{card.vocab.word}</div>
          {showZh && <div className="mt-1 text-xl text-drift">{card.vocab.zh}</div>}
          <div className="mt-4 flex justify-center"><AudioButton text={card.vocab.word} label="聽發音" big /></div>
          {card.vocab.example && <p className="mt-4 text-white/60">{card.vocab.example}</p>}
        </Card>
      )
    case 'sentence':
      return (
        <Card className="p-8 text-center">
          <div className="text-2xl font-bold">{card.sentence.text}</div>
          {showZh && card.sentence.zh && <div className="mt-2 text-drift">{card.sentence.zh}</div>}
          <div className="mt-4 flex justify-center"><AudioButton text={card.sentence.text} label="聽句子" big /></div>
        </Card>
      )
    case 'phonics':
      return (
        <Card className="p-8 text-center">
          <div className="text-sm text-pulse">自然發音 Phonics</div>
          <div className="mt-2 text-7xl font-extrabold">{card.grapheme}</div>
          <div className="mt-1 text-2xl text-drift">{card.sound}</div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {card.examples.map((w) => (
              <button key={w} onClick={() => play({ text: w })} className="no-select rounded-xl bg-white/10 px-3 py-2 text-lg font-bold ring-2 ring-white/10 active:scale-95">🔊 {w}</button>
            ))}
          </div>
        </Card>
      )
    case 'culture':
      return (
        <Card className="p-8 text-center">
          <div className="text-6xl">{card.emoji ?? '🌍'}</div>
          <div className="mt-3 text-xl font-bold">{card.title}</div>
          <p className="mt-2 text-white/70">{card.text}</p>
        </Card>
      )
    case 'dialogue':
      return (
        <Card className="p-6">
          <div className="space-y-3">
            {card.lines.map((l, idx) => (
              <div key={idx} className="rounded-2xl bg-white/5 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-drift">{l.speaker}</span>
                  <AudioButton text={l.text} />
                </div>
                <div className="text-lg">{l.text}</div>
                {showZh && l.zh && <div className="text-sm text-white/50">{l.zh}</div>}
              </div>
            ))}
          </div>
        </Card>
      )
  }
}

// ---- 結算 ----
function RewardPhase({ summary, title, ageTier, hasNext, onMap, onRetry, onNext }: {
  summary: LessonSummary; title: string; ageTier: 'low' | 'mid' | 'teen'; hasNext: boolean
  onMap: () => void; onRetry: () => void; onNext: () => void
}) {
  return (
    <Card className="p-8 text-center animate-pop-in">
      <div className="text-sm text-white/60">{title}</div>
      <h2 className="mt-1 text-2xl font-extrabold">{encourageComplete(ageTier, summary.stars)}</h2>
      <div className="my-5 flex justify-center"><StarRow count={summary.stars} size="text-5xl" /></div>
      <div className="mx-auto flex max-w-xs justify-around rounded-2xl bg-white/5 p-3">
        <div><div className="text-2xl font-bold text-pulse">+{summary.xpGained}</div><div className="text-xs text-white/50">XP</div></div>
        <div><div className="text-2xl font-bold text-star">+{summary.coins}</div><div className="text-xs text-white/50">金幣</div></div>
        <div><div className="text-2xl font-bold text-nova">{(summary.score * 100) | 0}%</div><div className="text-xs text-white/50">正確率</div></div>
      </div>

      {summary.newBadges.length > 0 && (
        <div className="mt-4 rounded-2xl bg-star/10 p-3 ring-2 ring-star/40">
          <div className="text-sm font-bold text-star">🎉 獲得新徽章！</div>
          <div className="mt-1 flex flex-wrap justify-center gap-2">
            {summary.newBadges.map((id) => (
              <span key={id} className="text-2xl">{badgeDef(id)?.emoji} <span className="text-sm">{badgeDef(id)?.name}</span></span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-2">
        {hasNext && <Button variant="success" onClick={onNext}>下一課 →</Button>}
        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={onRetry}>重新挑戰</Button>
          <Button variant="primary" className="flex-1" onClick={onMap}>回星河地圖</Button>
        </div>
      </div>
    </Card>
  )
}
