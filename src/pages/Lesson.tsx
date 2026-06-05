import { useEffect, useRef, useState } from 'react'
import { useApp } from '../state/AppContext'
import { Screen, Card, Button, StarRow, AudioButton } from '../components/ui'
import { SrsReview } from '../components/SrsReview'
import { ExerciseView } from '../components/ExerciseView'
import { loadLesson, loadManifest } from '../content/contentLoader'
import type { Lesson as LessonT, Exercise, TeachingCard, McqExercise, ReadingInput, ProductionTask } from '../types/content'
import type { SrsCard } from '../types/profile'
import { getDueCards, saveCard } from '../data/srsRepository'
import { reviewCard, type Recall } from '../game/srs'
import { finishLesson, type LessonSummary } from '../game/sessionFlow'
import { XP_RULES } from '../config/levels'
import { encourageComplete } from '../config/encourage'
import { badgeDef } from '../config/badges'
import { play } from '../audio/tts'
import { useRecorder } from '../hooks/useRecorder'

// 六段式：warmup → learn(Presentation) → practice(Controlled) → input → production → check(Review) → reward
type Stage = 'loading' | 'warmup' | 'learn' | 'practice' | 'input' | 'production' | 'check' | 'saving' | 'reward'

export function Lesson({ unitId, lessonFile }: { unitId: string; lessonFile: string }) {
  const { activeChild, showZh, navigate, refreshActive } = useApp()
  const [stage, setStage] = useState<Stage>('loading')
  const [lesson, setLesson] = useState<LessonT | null>(null)
  const [dueCards, setDueCards] = useState<SrsCard[]>([])
  const [pIdx, setPIdx] = useState(0)
  const [cIdx, setCIdx] = useState(0)
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
        setLesson(l); setDueCards(due); setNextFile(next)
        setStage(due.length ? 'warmup' : 'learn')
      } catch (e) {
        if (alive) setErr(e instanceof Error ? e.message : '載入失敗')
      }
    })()
    return () => { alive = false }
  }, [lessonFile, unitId, activeChild])

  if (err) return <Screen><Card className="p-6 text-center text-quasar">⚠️ {err}<div className="mt-4"><Button onClick={() => navigate({ name: 'dashboard' })}>回地圖</Button></div></Card></Screen>
  if (!lesson || !activeChild) return <Screen><div className="mt-20 text-center text-white/60">載入中…</div></Screen>

  const practice: Exercise[] = lesson.exercises.filter((e) => e.phase === 'guided' || e.phase === 'independent')
    .sort((a, b) => (a.phase === 'guided' ? 0 : 1) - (b.phase === 'guided' ? 0 : 1))
  const check: Exercise[] = lesson.exercises.filter((e) => e.phase === 'check')

  const afterPractice = () => setStage(lesson.input ? 'input' : lesson.production ? 'production' : 'check')
  const afterInput = () => setStage(lesson.production ? 'production' : 'check')

  const award = (correct: boolean, isSpeak: boolean, id: string, response: unknown) => {
    acc.current.responses[id] = response
    acc.current.xp += XP_RULES.attempt + (correct ? XP_RULES.correct : 0)
    if (isSpeak) { acc.current.speak += 1; acc.current.xp += XP_RULES.speakBonus }
  }

  const onPracticeDone = (correct: boolean, isSpeak: boolean, id: string, response: unknown) => {
    award(correct, isSpeak, id, response)
    if (pIdx + 1 < practice.length) setPIdx(pIdx + 1)
    else afterPractice()
  }

  const onCheckDone = async (correct: boolean, isSpeak: boolean, id: string, response: unknown) => {
    award(correct, isSpeak, id, response)
    if (cIdx + 1 < check.length) { setCIdx(cIdx + 1); return }
    setStage('saving')
    const s = await finishLesson({
      child: activeChild, lesson,
      checkResponses: acc.current.responses, xpFromExercises: acc.current.xp, speakDone: acc.current.speak,
    })
    await refreshActive()
    setSummary(s)
    setStage('reward')
  }

  const onSrsReview = (card: SrsCard, recall: Recall) => { void saveCard(reviewCard(card, recall)) }

  const restart = () => {
    acc.current = { xp: 0, speak: 0, responses: {} }
    setPIdx(0); setCIdx(0); setSummary(null)
    setStage('learn')
  }

  return (
    <Screen>
      <LessonHeader title={lesson.title} stage={stage} pStep={pIdx + 1} pTotal={practice.length} cStep={cIdx + 1} cTotal={check.length}
        onExit={() => navigate({ name: 'dashboard' })} />

      {stage === 'warmup' && (
        <div>
          <p className="mb-3 text-center text-white/70">先暖身複習一下之前學過的單字 🔥</p>
          <SrsReview cards={dueCards} onReview={onSrsReview} onFinish={() => setStage('learn')} />
          <div className="mt-3 text-center"><button onClick={() => setStage('learn')} className="text-sm text-white/40 underline">跳過暖身</button></div>
        </div>
      )}

      {stage === 'learn' && <LearnPhase lesson={lesson} showZh={showZh} onDone={() => setStage('practice')} />}

      {stage === 'practice' && practice[pIdx] && (
        <ExerciseView key={practice[pIdx].id} exercise={practice[pIdx]} ageTier={lesson.ageTier} showZh={showZh} seed={pIdx}
          onDone={(r, resp) => onPracticeDone(r.correct, practice[pIdx].type === 'speak', practice[pIdx].id, resp)} />
      )}

      {stage === 'input' && lesson.input && (
        <InputPhase lesson={lesson} input={lesson.input} ageTier={lesson.ageTier} showZh={showZh}
          onQuestion={(correct, id, resp) => award(correct, false, id, resp)} onDone={afterInput} />
      )}

      {stage === 'production' && lesson.production && (
        <ProductionPhase task={lesson.production} showZh={showZh}
          onDone={(isSpeak) => { award(true, isSpeak, `${lesson.id}-prod`, { done: true }); setStage('check') }} />
      )}

      {stage === 'check' && check[cIdx] && (
        <ExerciseView key={check[cIdx].id} exercise={check[cIdx]} ageTier={lesson.ageTier} showZh={showZh} seed={100 + cIdx}
          onDone={(r, resp) => onCheckDone(r.correct, false, check[cIdx].id, resp)} />
      )}

      {stage === 'saving' && <div className="mt-20 text-center text-white/60">結算中… ✨</div>}

      {stage === 'reward' && summary && (
        <RewardPhase summary={summary} title={lesson.title} ageTier={lesson.ageTier} hasNext={!!nextFile}
          onMap={() => navigate({ name: 'dashboard' })} onRetry={restart}
          onNext={() => { if (nextFile) { restart(); navigate({ name: 'lesson', unitId, lessonFile: nextFile }) } }} />
      )}
    </Screen>
  )
}

function LessonHeader({ title, stage, pStep, pTotal, cStep, cTotal, onExit }: {
  title: string; stage: Stage; pStep: number; pTotal: number; cStep: number; cTotal: number; onExit: () => void
}) {
  const label: Record<Stage, string> = {
    loading: '載入中', warmup: '暖身 Warm-up', learn: '學習新內容', practice: `練習 ${pStep}/${pTotal}`,
    input: '閱讀時間 Reading', production: '開口/動手做', check: `檢核 ${cStep}/${cTotal}`, saving: '結算', reward: '完成！',
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

// ---- ④ Input：分級閱讀短文 + 理解題 ----
function InputPhase({ lesson, input, ageTier, showZh, onQuestion, onDone }: {
  lesson: LessonT; input: ReadingInput; ageTier: 'low' | 'mid' | 'teen'; showZh: boolean
  onQuestion: (correct: boolean, id: string, resp: unknown) => void; onDone: () => void
}) {
  const [qIdx, setQIdx] = useState(-1) // -1 = 還在讀短文
  const questions = input.questions ?? []

  if (qIdx < 0) {
    return (
      <div className="animate-pop-in">
        <Card className="p-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-bold text-drift">📖 讀讀看</span>
            <AudioButton text={input.passage} label="朗讀" />
          </div>
          <p className="text-lg leading-relaxed">{input.passage}</p>
          {showZh && input.passageZh && <p className="mt-2 text-sm text-white/50">{input.passageZh}</p>}
        </Card>
        <div className="mt-4 flex justify-center">
          <Button variant="success" onClick={() => (questions.length ? setQIdx(0) : onDone())}>
            {questions.length ? '讀完了，回答問題 →' : '讀完了 →'}
          </Button>
        </div>
      </div>
    )
  }

  const q = questions[qIdx]
  const ex: McqExercise = {
    type: 'mcq', id: `${lesson.id}-in-${q.id}`, skill: 'reading', phase: 'independent', points: 10,
    prompt: q.prompt, promptZh: q.promptZh, options: q.options, answerId: q.answerId,
  }
  return (
    <div>
      <Card className="mb-3 p-3 text-sm text-white/70"><span className="text-drift">📖 </span>{input.passage}</Card>
      <ExerciseView key={ex.id} exercise={ex} ageTier={ageTier} showZh={showZh} seed={50 + qIdx}
        onDone={(r, resp) => { onQuestion(r.correct, ex.id, resp); if (qIdx + 1 < questions.length) setQIdx(qIdx + 1); else onDone() }} />
    </div>
  )
}

// ---- ⑤ Production：開放產出任務 ----
function ProductionPhase({ task, showZh, onDone }: {
  task: ProductionTask; showZh: boolean; onDone: (isSpeak: boolean) => void
}) {
  const rec = useRecorder()
  const [text, setText] = useState('')
  const isSpeak = task.mode === 'speak'
  return (
    <div className="animate-pop-in">
      <Card className="p-5 text-center">
        <div className="mb-1 text-sm text-quasar">{isSpeak ? '🎤 換你開口說' : '✍️ 換你寫寫看'}</div>
        <div className="text-xl font-bold">{task.prompt}</div>
        {showZh && task.promptZh && <div className="mt-1 text-sm text-white/60">{task.promptZh}</div>}
        {task.example && (
          <div className="mt-3 rounded-2xl bg-white/5 p-3 text-left text-sm">
            <span className="text-white/40">範例：</span> {task.example}
            {isSpeak && <span className="ml-2 inline-block align-middle"><AudioButton text={task.example} /></span>}
          </div>
        )}

        {isSpeak ? (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {rec.supported && !rec.recording && <Button variant="ghost" onClick={() => rec.start()}>🎙️ 開始錄音</Button>}
            {rec.supported && rec.recording && <Button variant="danger" onClick={() => rec.stop()}>⏹️ 停止</Button>}
            {rec.audioUrl && <Button variant="ghost" onClick={() => new Audio(rec.audioUrl!).play()}>▶️ 播放</Button>}
          </div>
        ) : (
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="在這裡寫英文句子…"
            className="mt-4 w-full rounded-xl bg-white/10 px-4 py-3 text-lg outline-none ring-2 ring-white/10 focus:ring-drift" />
        )}
      </Card>
      <div className="mt-4 flex justify-center">
        <Button variant="success" disabled={!isSpeak && text.trim().length === 0} onClick={() => onDone(isSpeak)}>
          ✅ 完成
        </Button>
      </div>
    </div>
  )
}

// ---- ② Presentation：教學卡 ----
function LearnPhase({ lesson, showZh, onDone }: { lesson: LessonT; showZh: boolean; onDone: () => void }) {
  const [i, setI] = useState(0)
  const cards = lesson.teaching
  const card = cards[i]
  const last = i === cards.length - 1
  useEffect(() => { const t = cardAudioText(card); if (t) play({ text: t }) }, [i]) // eslint-disable-line react-hooks/exhaustive-deps
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

// ---- ⑥ 結算 ----
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
            {summary.newBadges.map((id) => (<span key={id} className="text-2xl">{badgeDef(id)?.emoji} <span className="text-sm">{badgeDef(id)?.name}</span></span>))}
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
