import type { Child, PointsState } from '../types/profile'
import { Coins, Streak, XpBar } from './ui'
import { shopItem } from '../config/shop'

export function avatarEmoji(child: Child, points: PointsState | null): string {
  const equipped = points?.equippedAvatar ? shopItem(points.equippedAvatar)?.emoji : undefined
  return equipped ?? child.avatarEmoji
}

export function Hud({ child, points, onProfile }: { child: Child; points: PointsState; onProfile?: () => void }) {
  return (
    <div className="mb-4 rounded-3xl bg-space-800/70 p-3 ring-1 ring-white/10">
      <div className="flex items-center gap-3">
        <button onClick={onProfile} className="no-select grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-space-700 text-3xl ring-2 ring-white/10 active:scale-95">
          {avatarEmoji(child, points)}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className="truncate font-bold">{child.name}</span>
            <span className="flex items-center gap-3 text-sm">
              <Streak days={points.streakDays} />
              <Coins value={points.coins} />
            </span>
          </div>
          <div className="mt-1"><XpBar xp={points.xp} /></div>
        </div>
      </div>
    </div>
  )
}
