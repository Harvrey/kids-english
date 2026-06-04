import { useEffect, useRef, useState } from 'react'
import { useApp } from '../state/AppContext'
import { Screen, Card, Button } from '../components/ui'
import { ExerciseView } from '../components/ExerciseView'
import { loadQuiz } from '../content/contentLoader'
import type { QuizDef } from '../types/content'
import { finishQuiz, type QuizSummary } from '../game/sessionFlow'
import { badgeDef } from '../config/badges'

type Stage = 'loading' | 'intro' | 'running' | 'saving' | 'result'

export function Quiz({ unitId, quizFile, kind }: { unitId: string; quizFile: string; kind: 'review' | 'promotion' }) {
  const { activeChild, showZh, navigate, refreshActive } = useApp()
  const [stage, setStage] = useState<Stage>('loading')
  const [quiz, setQuiz] = useState<QuizDef | null>(null)
  const [idx, setIdx] = useState(0)
  const [result, setResult] = useState<QuizSummary | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const responses = useRef<Record<string, unknown>>({})

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const q = await loadQuiz(quizFile)
        if (alive) { setQuiz(q); setStage('intro') }
      } catch (e) {
        if (alive) setErr(e instanceof Error ? e.message : '載入失敗')
      }
    })()
    return () => { alive = false }
  }, [quizFile])

  if (err) return <Screen><Card className="p-6 text-center text-quasar">⚠️ {err}<div className="mt-4"><Button onClick={() => navigate({ name: 'dashboard' })}>回地圖</Button></div></Card></Screen>
  if (!quiz || !activeChild) return <Screen><div className="mt-20 text-center text-white/60">載入中…</div></Screen>

  const items = quiz.items
  const onDone = async (response: unknown) => {
    responses.current[items[idx].id] = response
    if (idx + 1 < items.length) {
      setIdx(idx + 1)
    } else {
      setStage('saving')
      const r = await finishQuiz({ child: activeChild, quiz, responses: responses.current })
      await refreshActive()
      setResult(r)
      setStage('result')
    }
  }

  const restart = () => { responses.current = {}; setIdx(0); setResult(null); setStage('running') }

  return (
    <Screen>
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => navigate({ name: 'dashboard' })} className="no-select grid h-10 w-10 place-items-center rounded-full bg-white/10 text-lg active:scale-90">✕</button>
        <div className="flex-1">
          <div className="text-sm text-white/60">{kind === 'promotion' ? '🛸 晉級測驗' : '📚 單元複習'}{stage === 'running' && ` · ${idx + 1}/${items.length}`}</div>
          <div className="truncate font-bold">{quiz.title}</div>
        </div>
      </div>

      {stage === 'intro' && (
        <Card className="p-6 text-center">
          <div className="text-6xl">{kind === 'promotion' ? '🛸' : '📚'}</div>
          <h2 className="mt-3 text-xl font-bold">{quiz.title}</h2>
          <p className="mt-2 text-white/70">共 {items.length} 題，通過門檻 {(quiz.passThreshold * 100) | 0}%。</p>
          {kind === 'promotion' && <p className="mt-1 text-sm text-white/50">通過就能解鎖下一個星系！每個技能也要達到基本分數喔。</p>}
          <div className="mt-6"><Button variant="star" onClick={() => setStage('running')} className="px-10">開始！</Button></div>
        </Card>
      )}

      {stage === 'running' && (
        <ExerciseView key={items[idx].id} exercise={items[idx]} ageTier={activeChild.ageTier} showZh={showZh} seed={idx}
          onDone={(_r, response) => onDone(response)} />
      )}

      {stage === 'saving' && <div className="mt-20 text-center text-white/60">批改中… ✨</div>}

      {stage === 'result' && result && (
        <ResultCard summary={result} kind={kind} onMap={() => navigate({ name: 'dashboard' })}
          onReview={() => navigate({ name: 'srs' })} onRetry={restart} unitId={unitId} />
      )}
    </Screen>
  )
}

function ResultCard({ summary, kind, onMap, onReview, onRetry }: {
  summary: QuizSummary; kind: 'review' | 'promotion'; unitId: string
  onMap: () => void; onReview: () => void; onRetry: () => void
}) {
  const { verdict } = summary
  const passed = verdict.passed
  return (
    <Card className="p-8 text-center animate-pop-in">
      <div className="text-7xl">{passed ? (kind === 'promotion' ? '🛸' : '🎉') : '💪'}</div>
      <h2 className="mt-3 text-2xl font-extrabold">{passed ? '太棒了，通過了！' : '差一點，再加油！'}</h2>
      <div className="mt-2 text-lg">得分 {(verdict.score * 100) | 0}%</div>

      <div className="mx-auto mt-4 flex max-w-xs justify-around rounded-2xl bg-white/5 p-3">
        <div><div className="text-2xl font-bold text-pulse">+{summary.xpGained}</div><div className="text-xs text-white/50">XP</div></div>
        <div><div className="text-2xl font-bold text-star">+{summary.coins}</div><div className="text-xs text-white/50">金幣</div></div>
      </div>

      {summary.newBadges.length > 0 && (
        <div className="mt-4 rounded-2xl bg-star/10 p-3 ring-2 ring-star/40">
          <div className="text-sm font-bold text-star">🎉 獲得新徽章！</div>
          <div className="mt-1 flex flex-wrap justify-center gap-2">
            {summary.newBadges.map((id) => <span key={id} className="text-2xl">{badgeDef(id)?.emoji} <span className="text-sm">{badgeDef(id)?.name}</span></span>)}
          </div>
        </div>
      )}

      {!passed && verdict.reasons.length > 0 && (
        <div className="mt-4 rounded-2xl bg-quasar/10 p-3 text-left ring-1 ring-quasar/30">
          <div className="text-sm font-bold text-quasar">還需要加強：</div>
          <ul className="mt-1 list-inside list-disc text-sm text-white/70">
            {verdict.reasons.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
          <p className="mt-2 text-xs text-white/50">建議先回去複習，再來挑戰一次！</p>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-2">
        {passed
          ? <Button variant="success" onClick={onMap}>回星河地圖 →</Button>
          : (
            <>
              <Button variant="primary" onClick={onReview}>🔁 去複習單字</Button>
              <div className="flex gap-2">
                {kind === 'review' && <Button variant="ghost" className="flex-1" onClick={onRetry}>再試一次</Button>}
                <Button variant="ghost" className="flex-1" onClick={onMap}>回地圖</Button>
              </div>
            </>
          )}
      </div>
    </Card>
  )
}
