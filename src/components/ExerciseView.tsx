import { useEffect, useState } from 'react'
import type { Exercise, AgeTier } from '../types/content'
import { grade, type GradeResult } from '../game/grade'
import { ExerciseInput, isReady } from './ExerciseInput'
import { Button, Card } from './ui'
import { encourageCorrect, encourageWrong } from '../config/encourage'

export function ExerciseView({
  exercise, ageTier, showZh, seed, onDone,
}: {
  exercise: Exercise
  ageTier: AgeTier
  showZh: boolean
  seed: number
  onDone: (result: GradeResult, response: unknown) => void
}) {
  const [response, setResponse] = useState<unknown>(undefined)
  const [revealed, setRevealed] = useState<GradeResult | null>(null)

  const ready = isReady(exercise, response)
  const isSpeak = exercise.type === 'speak'

  // 一般題：送出 → 顯示對錯回饋（由「繼續」鈕呼叫 onDone 前進）
  const submit = () => setRevealed(grade(exercise, response))

  // 口說題沒有「送出」鈕：按「我念完了」設定 done 後自動完成、直接前進
  useEffect(() => {
    if (isSpeak && !revealed && isReady(exercise, response)) {
      const result = grade(exercise, response)
      setRevealed(result)
      onDone(result, response)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response])

  return (
    <div className="animate-pop-in">
      <Card className="p-5">
        <ExerciseInput exercise={exercise} response={response} onChange={setResponse} revealed={revealed} showZh={showZh} />
      </Card>

      {!revealed && !isSpeak && (
        <div className="mt-4 flex justify-center">
          <Button variant="success" disabled={!ready} onClick={submit} className="px-10">送出</Button>
        </div>
      )}

      {revealed && !isSpeak && (
        <Feedback result={revealed} exercise={exercise} ageTier={ageTier} seed={seed}
          onContinue={() => onDone(revealed, response)} />
      )}
    </div>
  )
}

function Feedback({
  result, exercise, ageTier, seed, onContinue,
}: {
  result: GradeResult; exercise: Exercise; ageTier: AgeTier; seed: number; onContinue: () => void
}) {
  const good = result.correct || result.score >= 0.6
  const msg = good ? encourageCorrect(ageTier, seed) : encourageWrong(ageTier, seed)
  const explain = exercise.type === 'mcq' ? exercise.explain : undefined
  return (
    <div className={`mt-4 rounded-3xl p-4 text-center ring-2 animate-pop-in ${good ? 'bg-nova/15 ring-nova' : 'bg-quasar/15 ring-quasar'}`}>
      <div className="text-2xl font-extrabold">{good ? '✅ ' : '💪 '}{msg}</div>
      {result.score > 0 && result.score < 1 && (
        <div className="mt-1 text-sm text-white/70">得分 {(result.score * 100) | 0}%</div>
      )}
      {explain && <p className="mt-2 text-sm text-white/70">{explain}</p>}
      <div className="mt-3 flex justify-center">
        <Button variant="primary" onClick={onContinue} className="px-10">繼續 →</Button>
      </div>
    </div>
  )
}
