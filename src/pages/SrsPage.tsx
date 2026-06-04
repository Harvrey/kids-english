import { useEffect, useState } from 'react'
import { useApp } from '../state/AppContext'
import { Screen, Card, Button } from '../components/ui'
import { SrsReview } from '../components/SrsReview'
import { getDueCards, saveCard } from '../data/srsRepository'
import { reviewCard, SRS_DAILY_CAP, type Recall } from '../game/srs'
import type { SrsCard } from '../types/profile'

export function SrsPage() {
  const { activeChild, navigate, refreshActive } = useApp()
  const [cards, setCards] = useState<SrsCard[] | null>(null)

  useEffect(() => {
    if (!activeChild) return
    getDueCards(activeChild.id, SRS_DAILY_CAP).then(setCards)
  }, [activeChild])

  if (!activeChild) return null

  const onReview = (card: SrsCard, recall: Recall) => { void saveCard(reviewCard(card, recall)) }
  const onFinish = async () => { await refreshActive(); navigate({ name: 'dashboard' }) }

  return (
    <Screen>
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => navigate({ name: 'dashboard' })} className="no-select grid h-10 w-10 place-items-center rounded-full bg-white/10 text-lg active:scale-90">←</button>
        <h1 className="text-xl font-bold">🔁 今日單字複習</h1>
      </div>
      {cards === null
        ? <div className="mt-20 text-center text-white/60">載入中…</div>
        : cards.length === 0
          ? <Card className="p-8 text-center"><div className="text-5xl">🌙</div><p className="mt-2">今天沒有要複習的單字！<br />去星河地圖學新東西吧 🚀</p><div className="mt-4"><Button onClick={() => navigate({ name: 'dashboard' })}>回地圖</Button></div></Card>
          : <SrsReview cards={cards} onReview={onReview} onFinish={onFinish} />}
    </Screen>
  )
}
