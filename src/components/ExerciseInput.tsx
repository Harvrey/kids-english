import { useEffect, useMemo, useState } from 'react'
import type { Exercise, OptionItem } from '../types/content'
import type { GradeResult } from '../game/grade'
import { AudioButton, Button } from './ui'
import { play } from '../audio/tts'
import { useRecorder } from '../hooks/useRecorder'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** 是否已完成作答（可送出） */
export function isReady(ex: Exercise, response: unknown): boolean {
  switch (ex.type) {
    case 'mcq':
    case 'listen-choose':
      return typeof response === 'string' && response.length > 0
    case 'matching':
      return !!response && Object.keys(response as object).length === ex.pairs.length
    case 'reading':
      return !!response && Object.keys(response as object).length === ex.questions.length
    case 'fill-in':
    case 'spelling':
      return typeof response === 'string' && response.trim().length > 0
    case 'ordering':
      return Array.isArray(response) && response.length === ex.tokens.length
    case 'speak':
      return !!(response as { done?: boolean })?.done
  }
}

interface InputProps {
  exercise: Exercise
  response: unknown
  onChange: (r: unknown) => void
  revealed: GradeResult | null
  showZh: boolean
}

export function ExerciseInput(props: InputProps) {
  const { exercise } = props
  switch (exercise.type) {
    case 'mcq':
      return <McqInput {...props} />
    case 'listen-choose':
      return <ListenChooseInput {...props} />
    case 'matching':
      return <MatchingInput {...props} />
    case 'fill-in':
      return <FillInInput {...props} />
    case 'ordering':
      return <OrderingInput {...props} />
    case 'spelling':
      return <SpellingInput {...props} />
    case 'speak':
      return <SpeakInput {...props} />
    case 'reading':
      return <ReadingInput {...props} />
  }
}

// ---------------------------------------------------------------------------

function Prompt({ text, zh, showZh }: { text?: string; zh?: string; showZh: boolean }) {
  return (
    <div className="mb-3 text-center">
      {text && <div className="text-xl font-bold">{text}</div>}
      {showZh && zh && <div className="mt-1 text-sm text-white/60">{zh}</div>}
    </div>
  )
}

function OptionButton({
  opt, selected, state, onClick,
}: {
  opt: OptionItem; selected: boolean; state: 'idle' | 'correct' | 'wrong' | 'dim'; onClick: () => void
}) {
  const cls =
    state === 'correct' ? 'bg-nova/30 ring-nova' :
    state === 'wrong' ? 'bg-red-400/30 ring-red-400' :
    selected ? 'bg-drift/30 ring-drift' : 'bg-white/5 ring-white/10'
  return (
    <button
      type="button" onClick={onClick}
      className={`no-select flex min-h-[64px] items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xl font-semibold ring-2 transition active:scale-95 ${cls} ${state === 'dim' ? 'opacity-50' : ''}`}
    >
      {opt.emoji && <span className="text-4xl">{opt.emoji}</span>}
      {opt.text && <span>{opt.text}</span>}
    </button>
  )
}

function optionState(optId: string, answerId: string, chosen: string | undefined, revealed: GradeResult | null): 'idle' | 'correct' | 'wrong' | 'dim' {
  if (!revealed) return chosen === optId ? 'idle' : 'idle'
  if (optId === answerId) return 'correct'
  if (chosen === optId) return 'wrong'
  return 'dim'
}

// ---- MCQ ----
function McqInput({ exercise, response, onChange, revealed, showZh }: InputProps) {
  if (exercise.type !== 'mcq') return null
  const chosen = response as string | undefined
  return (
    <div>
      <Prompt text={exercise.prompt} zh={exercise.promptZh} showZh={showZh} />
      {exercise.audioText && <div className="mb-3 flex justify-center"><AudioButton text={exercise.audioText} big /></div>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {exercise.options.map((o) => (
          <OptionButton key={o.id} opt={o} selected={chosen === o.id}
            state={optionState(o.id, exercise.answerId, chosen, revealed)}
            onClick={() => !revealed && onChange(o.id)} />
        ))}
      </div>
    </div>
  )
}

// ---- Listen & choose（自動播放） ----
function ListenChooseInput({ exercise, response, onChange, revealed, showZh }: InputProps) {
  if (exercise.type !== 'listen-choose') return null
  const chosen = response as string | undefined
  useEffect(() => { play({ text: exercise.audioText }) }, [exercise.id]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div>
      <Prompt zh={exercise.promptZh} showZh={showZh} />
      <div className="mb-4 flex justify-center"><AudioButton text={exercise.audioText} label="再聽一次" big /></div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {exercise.options.map((o) => (
          <OptionButton key={o.id} opt={o} selected={chosen === o.id}
            state={optionState(o.id, exercise.answerId, chosen, revealed)}
            onClick={() => !revealed && onChange(o.id)} />
        ))}
      </div>
    </div>
  )
}

// ---- Matching ----
function MatchingInput({ exercise, response, onChange, revealed, showZh }: InputProps) {
  if (exercise.type !== 'matching') return null
  const map = (response as Record<string, string>) || {}
  const [selLeft, setSelLeft] = useState<string | null>(null)
  const rights = useMemo(() => shuffle(exercise.pairs.map((p) => ({ id: p.id, right: p.right }))), [exercise.id])
  const usedRight = new Set(Object.values(map))

  const assign = (rightId: string) => {
    if (revealed || !selLeft) return
    onChange({ ...map, [selLeft]: rightId })
    setSelLeft(null)
  }
  const tapLeft = (leftId: string) => {
    if (revealed) return
    // 再點一次取消已配對
    if (map[leftId]) { const m = { ...map }; delete m[leftId]; onChange(m); return }
    setSelLeft(leftId)
  }

  const leftCellState = (leftId: string) => {
    if (!revealed) return selLeft === leftId ? 'ring-drift bg-drift/20' : map[leftId] ? 'ring-nova/50 bg-white/5' : 'ring-white/10 bg-white/5'
    return map[leftId] === leftId ? 'ring-nova bg-nova/20' : 'ring-red-400 bg-red-400/20'
  }

  return (
    <div>
      <Prompt zh={showZh ? exercise.promptZh : undefined} showZh={showZh} />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          {exercise.pairs.map((p) => (
            <button key={p.id} type="button" onClick={() => tapLeft(p.id)}
              className={`no-select flex w-full min-h-[56px] items-center justify-between gap-2 rounded-2xl px-3 py-2 text-lg font-semibold ring-2 transition active:scale-95 ${leftCellState(p.id)}`}>
              <span className="flex items-center gap-2">
                {p.left.emoji && <span className="text-3xl">{p.left.emoji}</span>}
                {p.left.text && <span>{p.left.text}</span>}
                {p.left.audioText && <AudioButton text={p.left.audioText} />}
              </span>
              {map[p.id] && <span className="text-2xl">{exercise.pairs.find((x) => x.id === map[p.id])?.right.emoji ?? exercise.pairs.find((x) => x.id === map[p.id])?.right.text}</span>}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {rights.map((r) => (
            <button key={r.id} type="button" onClick={() => assign(r.id)} disabled={usedRight.has(r.id) && !selLeft}
              className={`no-select flex w-full min-h-[56px] items-center justify-center gap-2 rounded-2xl px-3 py-2 text-lg font-semibold ring-2 transition active:scale-95 ${usedRight.has(r.id) ? 'opacity-40 ring-white/10 bg-white/5' : 'ring-white/20 bg-white/10'}`}>
              {r.right.emoji && <span className="text-3xl">{r.right.emoji}</span>}
              {r.right.text && <span>{r.right.text}</span>}
            </button>
          ))}
        </div>
      </div>
      {!revealed && <p className="mt-2 text-center text-xs text-white/50">先點左邊，再點右邊配對；再點一次左邊可取消</p>}
    </div>
  )
}

// ---- Fill in ----
function FillInInput({ exercise, response, onChange, revealed, showZh }: InputProps) {
  if (exercise.type !== 'fill-in') return null
  const val = (response as string) ?? ''
  const [before, after] = exercise.prompt.split('___')
  const ok = revealed?.correct
  return (
    <div>
      <Prompt zh={showZh ? exercise.promptZh : undefined} showZh={showZh} />
      {exercise.audioText && <div className="mb-3 flex justify-center"><AudioButton text={exercise.audioText} big /></div>}
      <div className="mb-4 flex flex-wrap items-center justify-center gap-1 text-2xl font-bold">
        <span>{before}</span>
        <span className={`min-w-[80px] rounded-lg border-b-4 px-2 text-center ${revealed ? (ok ? 'border-nova text-nova' : 'border-red-400 text-red-400') : 'border-drift'}`}>
          {val || '＿＿'}
        </span>
        <span>{after}</span>
      </div>
      {revealed && !ok && <p className="mb-3 text-center text-nova">正解：{revealed.correctAnswer}</p>}
      {exercise.wordBank && (
        <div className="mb-3 flex flex-wrap justify-center gap-2">
          {exercise.wordBank.map((w) => (
            <button key={w} type="button" disabled={!!revealed} onClick={() => onChange(w)}
              className={`no-select rounded-xl px-4 py-2 text-lg font-semibold ring-2 transition active:scale-95 ${val === w ? 'bg-drift/30 ring-drift' : 'bg-white/5 ring-white/10'}`}>
              {w}
            </button>
          ))}
        </div>
      )}
      {!exercise.wordBank && (
        <input value={val} disabled={!!revealed} onChange={(e) => onChange(e.target.value)}
          placeholder="在這裡打字" autoCapitalize="off" autoCorrect="off"
          className="mx-auto block w-full max-w-xs rounded-xl bg-white/10 px-4 py-3 text-center text-xl outline-none ring-2 ring-white/10 focus:ring-drift" />
      )}
    </div>
  )
}

// ---- Ordering ----
function OrderingInput({ exercise, onChange, revealed, showZh }: InputProps) {
  if (exercise.type !== 'ordering') return null
  const order = useMemo(() => shuffle(exercise.tokens.map((t, i) => ({ i, t }))), [exercise.id])
  const [chosenIdx, setChosenIdx] = useState<number[]>([])
  // 內部用 idx 追蹤（含重複字），對外輸出 token 字串陣列
  const setChosen = (idx: number[]) => {
    setChosenIdx(idx)
    onChange(idx.map((i) => exercise.tokens[i]))
  }
  const remaining = order.filter((o) => !chosenIdx.includes(o.i))
  return (
    <div>
      <Prompt zh={showZh ? exercise.promptZh : undefined} showZh={showZh} />
      {exercise.audioText && <div className="mb-3 flex justify-center"><AudioButton text={exercise.audioText} label="聽提示" big /></div>}
      <div className={`mb-3 flex min-h-[56px] flex-wrap items-center justify-center gap-2 rounded-2xl p-3 ring-2 ${revealed ? (revealed.correct ? 'ring-nova bg-nova/10' : 'ring-red-400 bg-red-400/10') : 'ring-white/10 bg-white/5'}`}>
        {chosenIdx.length === 0 && <span className="text-white/40">把字排到這裡 →</span>}
        {chosenIdx.map((i, pos) => (
          <button key={pos} type="button" disabled={!!revealed} onClick={() => setChosen(chosenIdx.filter((_, p) => p !== pos))}
            className="no-select rounded-xl bg-drift/30 px-3 py-2 text-lg font-bold ring-2 ring-drift active:scale-95">
            {exercise.tokens[i]}
          </button>
        ))}
      </div>
      {revealed && !revealed.correct && <p className="mb-3 text-center text-nova">正解：{revealed.correctAnswer}</p>}
      <div className="flex flex-wrap justify-center gap-2">
        {remaining.map((o) => (
          <button key={o.i} type="button" disabled={!!revealed} onClick={() => setChosen([...chosenIdx, o.i])}
            className="no-select rounded-xl bg-white/10 px-3 py-2 text-lg font-bold ring-2 ring-white/10 active:scale-95">
            {o.t}
          </button>
        ))}
      </div>
    </div>
  )
}

// ---- Spelling ----
function SpellingInput({ exercise, response, onChange, revealed, showZh }: InputProps) {
  if (exercise.type !== 'spelling') return null
  const val = (response as string) ?? ''
  const tiles = useMemo(() => shuffle(exercise.word.split('').map((c, i) => ({ i, c }))), [exercise.id])
  const [usedIdx, setUsedIdx] = useState<number[]>([])
  const setUsed = (idx: number[]) => {
    setUsedIdx(idx)
    onChange(idx.map((i) => exercise.word[i]).join(''))
  }
  const ok = revealed?.correct

  return (
    <div className="text-center">
      <Prompt zh={showZh ? exercise.zh : undefined} showZh={showZh} />
      <div className="mb-2 text-6xl">{exercise.emoji ?? '🔤'}</div>
      <div className="mb-3 flex justify-center"><AudioButton text={exercise.audioText ?? exercise.word} label="聽發音" big /></div>

      {exercise.mode === 'type' || !exercise.mode ? (
        <input value={val} disabled={!!revealed} onChange={(e) => onChange(e.target.value)}
          placeholder="拼出單字" autoCapitalize="off" autoCorrect="off" spellCheck={false}
          className={`mx-auto block w-full max-w-xs rounded-xl bg-white/10 px-4 py-3 text-center text-2xl tracking-widest outline-none ring-2 focus:ring-drift ${revealed ? (ok ? 'ring-nova' : 'ring-red-400') : 'ring-white/10'}`} />
      ) : (
        <>
          <div className={`mx-auto mb-3 flex min-h-[56px] max-w-sm flex-wrap items-center justify-center gap-1 rounded-2xl p-2 ring-2 ${revealed ? (ok ? 'ring-nova bg-nova/10' : 'ring-red-400 bg-red-400/10') : 'ring-white/10 bg-white/5'}`}>
            {usedIdx.length === 0 && <span className="text-white/40">點字母拼單字</span>}
            {usedIdx.map((i, pos) => (
              <button key={pos} type="button" disabled={!!revealed} onClick={() => setUsed(usedIdx.filter((_, p) => p !== pos))}
                className="no-select h-11 w-9 rounded-lg bg-drift/30 text-2xl font-bold uppercase ring-2 ring-drift active:scale-90">
                {exercise.word[i]}
              </button>
            ))}
          </div>
          <div className="mx-auto flex max-w-sm flex-wrap justify-center gap-1">
            {tiles.filter((t) => !usedIdx.includes(t.i)).map((t) => (
              <button key={t.i} type="button" disabled={!!revealed} onClick={() => setUsed([...usedIdx, t.i])}
                className="no-select h-11 w-9 rounded-lg bg-white/10 text-2xl font-bold uppercase ring-2 ring-white/10 active:scale-90">
                {t.c}
              </button>
            ))}
          </div>
        </>
      )}
      {revealed && !ok && <p className="mt-3 text-nova">正解：{revealed.correctAnswer}</p>}
    </div>
  )
}

// ---- Speak（錄音 + 自評，不計分） ----
function SpeakInput({ exercise, response, onChange, showZh }: InputProps) {
  if (exercise.type !== 'speak') return null
  const rec = useRecorder()
  const done = !!(response as { done?: boolean })?.done
  return (
    <div className="text-center">
      <div className="mb-1 text-sm text-quasar">🎤 {exercise.mode === 'repeat-required' ? '跟著念念看' : '加分挑戰：自己說說看'}</div>
      <div className="mb-2 text-2xl font-bold">{exercise.target}</div>
      {showZh && exercise.zh && <div className="mb-3 text-sm text-white/60">{exercise.zh}</div>}
      <div className="mb-4 flex justify-center"><AudioButton text={exercise.target} label="聽老師念" big /></div>

      <div className="mb-3 flex flex-wrap justify-center gap-2">
        {rec.supported && !rec.recording && <Button variant="ghost" onClick={() => rec.start()}>🎙️ 開始錄音</Button>}
        {rec.supported && rec.recording && <Button variant="danger" onClick={() => rec.stop()}>⏹️ 停止</Button>}
        {rec.audioUrl && <Button variant="ghost" onClick={() => new Audio(rec.audioUrl!).play()}>▶️ 播放我的聲音</Button>}
      </div>
      {rec.error && <p className="mb-2 text-sm text-white/60">{rec.error}</p>}

      {!done ? (
        <Button variant="success" onClick={() => onChange({ done: true })}>✅ 我念完了</Button>
      ) : (
        <p className="font-bold text-nova">很棒，勇敢開口了！🎉</p>
      )}
    </div>
  )
}

// ---- Reading ----
function ReadingInput({ exercise, response, onChange, revealed, showZh }: InputProps) {
  if (exercise.type !== 'reading') return null
  const ans = (response as Record<string, string>) || {}
  return (
    <div>
      <Prompt zh={showZh ? exercise.promptZh : undefined} showZh={showZh} />
      <div className="mb-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
        <div className="flex items-start justify-between gap-2">
          <p className="text-lg leading-relaxed">{exercise.passage}</p>
          <AudioButton text={exercise.passage} />
        </div>
        {showZh && exercise.passageZh && <p className="mt-2 text-sm text-white/50">{exercise.passageZh}</p>}
      </div>
      <div className="space-y-4">
        {exercise.questions.map((q) => (
          <div key={q.id}>
            <div className="mb-2 font-semibold">{q.prompt}</div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {q.options.map((o) => (
                <OptionButton key={o.id} opt={o} selected={ans[q.id] === o.id}
                  state={optionState(o.id, q.answerId, ans[q.id], revealed)}
                  onClick={() => !revealed && onChange({ ...ans, [q.id]: o.id })} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
