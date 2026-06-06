import { useEffect, useState } from 'react'
import { useApp } from '../state/AppContext'
import { Screen, Card, Button, AudioButton, Pill } from '../components/ui'
import { ExerciseView } from '../components/ExerciseView'
import { loadReadersManifest, loadReader } from '../content/contentLoader'
import type { ReaderRef, Reader, McqExercise } from '../types/content'
import { finishReader, type ReaderSummary } from '../game/sessionFlow'
import { badgeDef } from '../config/badges'
import { play } from '../audio/tts'

export function Reading() {
  const { activeChild, points, navigate, refreshActive } = useApp()
  const [refs, setRefs] = useState<ReaderRef[] | null>(null)
  const [reader, setReader] = useState<Reader | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    loadReadersManifest().then((m) => setRefs(m.readers)).catch((e) => setErr(e instanceof Error ? e.message : '載入失敗'))
  }, [])

  if (!activeChild || !points) return null
  const booksRead = points.booksRead ?? []

  if (reader) {
    return <ReaderView reader={reader} onClose={async () => { await refreshActive(); setReader(null) }} />
  }

  return (
    <Screen>
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => navigate({ name: 'dashboard' })} className="no-select grid h-10 w-10 place-items-center rounded-full bg-white/10 text-lg active:scale-90">←</button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">📚 閱讀樂園</h1>
          <div className="text-xs text-white/50">讀過 {booksRead.length} / {refs?.length ?? 0} 本 · 多讀多認字！</div>
        </div>
      </div>

      {err && <Card className="mb-4 p-4 text-center text-quasar">⚠️ {err}</Card>}
      {!refs && !err && <div className="mt-20 text-center text-white/60">載入中…</div>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {refs?.map((r) => {
          const done = booksRead.includes(r.id)
          return (
            <Card key={r.id} className="relative flex flex-col items-center p-4 text-center"
              onClick={async () => { try { setReader(await loadReader(r.file)) } catch (e) { setErr(e instanceof Error ? e.message : '載入失敗') } }}>
              <div className="text-5xl">{r.cover}</div>
              <div className="mt-2 text-sm font-bold leading-tight">{r.title}</div>
              <div className="text-xs text-white/50">{r.titleZh}</div>
              <Pill className="mt-2 bg-drift/20 text-drift">{r.level}</Pill>
              {done && <span className="absolute right-2 top-2 text-nova">✓</span>}
            </Card>
          )
        })}
      </div>
    </Screen>
  )
}

type Phase = 'pages' | 'quiz' | 'reward'

function ReaderView({ reader, onClose }: { reader: Reader; onClose: () => void }) {
  const { activeChild, showZh } = useApp()
  const [phase, setPhase] = useState<Phase>('pages')
  const [pageIdx, setPageIdx] = useState(0)
  const [qIdx, setQIdx] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [summary, setSummary] = useState<ReaderSummary | null>(null)

  const page = reader.pages[pageIdx]
  const lastPage = pageIdx === reader.pages.length - 1

  useEffect(() => { if (phase === 'pages' && page) play({ text: page.text }) }, [pageIdx, phase]) // eslint-disable-line react-hooks/exhaustive-deps

  const startQuiz = () => (reader.questions.length ? setPhase('quiz') : finish(0))

  const finish = async (correctCount: number) => {
    const score = reader.questions.length ? correctCount / reader.questions.length : 1
    if (!activeChild) return
    const s = await finishReader({ child: activeChild, readerId: reader.id, score })
    setSummary(s)
    setPhase('reward')
  }

  return (
    <Screen>
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onClose} className="no-select grid h-10 w-10 place-items-center rounded-full bg-white/10 text-lg active:scale-90">✕</button>
        <div className="flex-1">
          <div className="text-sm text-white/60">📖 {reader.titleZh}</div>
          <div className="truncate font-bold">{reader.title}</div>
        </div>
      </div>

      {phase === 'pages' && page && (
        <div className="animate-pop-in">
          <Card className="flex min-h-[280px] flex-col items-center justify-center p-8 text-center">
            {pageIdx === 0 && <div className="mb-4 text-7xl">{reader.cover}</div>}
            <p className="text-2xl font-bold leading-relaxed">{page.text}</p>
            {showZh && page.zh && <p className="mt-3 text-white/60">{page.zh}</p>}
            <div className="mt-5"><AudioButton text={page.text} label="朗讀" big /></div>
          </Card>
          <div className="mt-2 text-center text-xs text-white/40">第 {pageIdx + 1} / {reader.pages.length} 頁</div>
          <div className="mt-3 flex justify-between gap-3">
            <Button variant="ghost" disabled={pageIdx === 0} onClick={() => setPageIdx(pageIdx - 1)}>← 上一頁</Button>
            {!lastPage
              ? <Button variant="primary" onClick={() => setPageIdx(pageIdx + 1)}>下一頁 →</Button>
              : <Button variant="success" onClick={startQuiz}>{reader.questions.length ? '讀完了，回答問題 →' : '讀完了 →'}</Button>}
          </div>
        </div>
      )}

      {phase === 'quiz' && reader.questions[qIdx] && (() => {
        const q = reader.questions[qIdx]
        const ex: McqExercise = { type: 'mcq', id: `${reader.id}-${q.id}`, skill: 'reading', phase: 'check', points: 10, prompt: q.prompt, promptZh: q.promptZh, options: q.options, answerId: q.answerId }
        return (
          <div>
            <div className="mb-2 text-center text-xs text-white/40">問題 {qIdx + 1} / {reader.questions.length}</div>
            <ExerciseView key={ex.id} exercise={ex} ageTier={activeChild!.ageTier} showZh={showZh} seed={qIdx}
              onDone={(r) => {
                const c = correct + (r.correct ? 1 : 0)
                setCorrect(c)
                if (qIdx + 1 < reader.questions.length) setQIdx(qIdx + 1)
                else finish(c)
              }} />
          </div>
        )
      })()}

      {phase === 'reward' && summary && (
        <Card className="p-8 text-center animate-pop-in">
          <div className="text-7xl">{reader.cover}</div>
          <h2 className="mt-3 text-2xl font-extrabold">讀完一本書，太棒了！📖</h2>
          <div className="mx-auto mt-4 flex max-w-xs justify-around rounded-2xl bg-white/5 p-3">
            <div><div className="text-2xl font-bold text-pulse">+{summary.xpGained}</div><div className="text-xs text-white/50">XP</div></div>
            <div><div className="text-2xl font-bold text-star">+{summary.coins}</div><div className="text-xs text-white/50">金幣</div></div>
          </div>
          {!summary.firstTime && <p className="mt-2 text-xs text-white/40">（重讀也很棒，但獎勵較少）</p>}
          {summary.newBadges.length > 0 && (
            <div className="mt-4 rounded-2xl bg-star/10 p-3 ring-2 ring-star/40">
              <div className="text-sm font-bold text-star">🎉 獲得新徽章！</div>
              <div className="mt-1 flex flex-wrap justify-center gap-2">
                {summary.newBadges.map((id) => <span key={id} className="text-2xl">{badgeDef(id)?.emoji} <span className="text-sm">{badgeDef(id)?.name}</span></span>)}
              </div>
            </div>
          )}
          <div className="mt-6"><Button variant="primary" onClick={onClose}>📚 回到書架</Button></div>
        </Card>
      )}
    </Screen>
  )
}
