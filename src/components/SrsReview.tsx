import { useState } from 'react'
import type { SrsCard } from '../types/profile'
import type { Recall } from '../game/srs'
import { AudioButton, Button, Card } from './ui'

export function SrsReview({
  cards, onReview, onFinish, title = '今日單字複習',
}: {
  cards: SrsCard[]
  onReview: (card: SrsCard, recall: Recall) => void
  onFinish: () => void
  title?: string
}) {
  const [i, setI] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const card = cards[i]

  if (!card) {
    return (
      <Card className="p-6 text-center">
        <div className="text-5xl">🌙</div>
        <p className="mt-2 text-lg">今天沒有要複習的單字，去學新東西吧！</p>
        <div className="mt-4 flex justify-center"><Button onClick={onFinish}>好的</Button></div>
      </Card>
    )
  }

  const grade = (recall: Recall) => {
    onReview(card, recall)
    setFlipped(false)
    if (i + 1 < cards.length) setI(i + 1)
    else onFinish()
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm text-white/60">
        <span>{title}</span>
        <span>{i + 1} / {cards.length}</span>
      </div>
      <Card className="p-8 text-center" onClick={() => setFlipped((f) => !f)}>
        <div className="text-7xl">{card.emoji ?? '🔤'}</div>
        <div className="mt-3 text-3xl font-extrabold">{card.word}</div>
        <div className="mt-2 flex justify-center"><AudioButton text={card.word} label="發音" /></div>
        <div className="mt-4 min-h-[28px] text-xl text-drift">
          {flipped ? card.zh : <span className="text-white/40">（點卡片看中文意思）</span>}
        </div>
      </Card>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Button variant="danger" onClick={() => grade(0)}>忘了</Button>
        <Button variant="ghost" onClick={() => grade(2)}>想起來了</Button>
        <Button variant="success" onClick={() => grade(3)}>很熟！</Button>
      </div>
    </div>
  )
}
