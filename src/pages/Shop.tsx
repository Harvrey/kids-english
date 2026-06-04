import type { ReactNode } from 'react'
import { useApp } from '../state/AppContext'
import { Screen, Card, Button, Coins } from '../components/ui'
import { SHOP_ITEMS, type ShopItem } from '../config/shop'
import { buyItem, equipAvatar } from '../game/pointsService'

export function Shop() {
  const { activeChild, points, savePoints, navigate } = useApp()
  if (!activeChild || !points) return null

  const avatars = SHOP_ITEMS.filter((i) => i.category === 'avatar')
  const decos = SHOP_ITEMS.filter((i) => i.category === 'decoration')

  const onBuy = async (item: ShopItem) => {
    const r = buyItem(points, item)
    if (!r.ok) { alert(r.reason); return }
    await savePoints(r.points)
  }
  const onEquip = async (id: string) => { await savePoints(equipAvatar(points, id)) }

  return (
    <Screen>
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => navigate({ name: 'dashboard' })} className="no-select grid h-10 w-10 place-items-center rounded-full bg-white/10 text-lg active:scale-90">←</button>
        <h1 className="text-xl font-bold">🛒 星河商店</h1>
        <span className="text-lg"><Coins value={points.coins} /></span>
      </div>

      <Section title="👤 頭像（可裝備）">
        {avatars.map((item) => {
          const owned = points.ownedItems.includes(item.id)
          const equipped = points.equippedAvatar === item.id
          return (
            <ItemCard key={item.id} item={item} owned={owned} equipped={equipped}
              onBuy={() => onBuy(item)} onEquip={() => onEquip(item.id)} />
          )
        })}
      </Section>

      <Section title="✨ 裝飾收藏">
        {decos.map((item) => {
          const owned = points.ownedItems.includes(item.id)
          return <ItemCard key={item.id} item={item} owned={owned} onBuy={() => onBuy(item)} />
        })}
      </Section>

      <p className="mt-6 text-center text-xs text-white/40">外觀只是好看用的，不會影響學習或測驗喔 😊</p>
    </Screen>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="mb-2 font-bold text-white/80">{title}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{children}</div>
    </div>
  )
}

function ItemCard({ item, owned, equipped, onBuy, onEquip }: {
  item: ShopItem; owned: boolean; equipped?: boolean; onBuy: () => void; onEquip?: () => void
}) {
  return (
    <Card className="flex flex-col items-center p-4 text-center">
      <div className="text-5xl">{item.emoji}</div>
      <div className="mt-2 text-sm font-semibold">{item.name}</div>
      <div className="mt-2 w-full">
        {!owned ? (
          <Button variant="star" className="w-full text-sm" onClick={onBuy}>🪙 {item.price}</Button>
        ) : onEquip ? (
          <Button variant={equipped ? 'success' : 'ghost'} className="w-full text-sm" onClick={onEquip} disabled={equipped}>
            {equipped ? '使用中' : '裝備'}
          </Button>
        ) : (
          <div className="rounded-xl bg-nova/20 py-2 text-sm font-semibold text-nova">已擁有</div>
        )}
      </div>
    </Card>
  )
}
