import type { ReactNode } from 'react'
import { play } from '../audio/tts'
import { levelFromXp } from '../config/levels'

// ---------------------------------------------------------------------------
// 容器
// ---------------------------------------------------------------------------

export function Screen({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`starfield app-scale min-h-full relative ${className}`}>
      <div className="relative z-10 mx-auto w-full max-w-screen-md px-4 py-4 pb-28">{children}</div>
    </div>
  )
}

export function Card({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-3xl bg-space-800/80 ring-1 ring-white/10 shadow-lg ${onClick ? 'cursor-pointer active:scale-[0.99] transition' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// 按鈕
// ---------------------------------------------------------------------------

type Variant = 'primary' | 'success' | 'ghost' | 'danger' | 'star'
const VARIANT: Record<Variant, string> = {
  primary: 'bg-drift text-space-900 hover:brightness-110',
  success: 'bg-nova text-space-900 hover:brightness-110',
  star: 'bg-star text-space-900 hover:brightness-110',
  danger: 'bg-red-400 text-space-900 hover:brightness-110',
  ghost: 'bg-white/10 text-white hover:bg-white/20',
}

export function Button({
  children, onClick, variant = 'primary', disabled, className = '', type = 'button',
}: {
  children: ReactNode; onClick?: () => void; variant?: Variant; disabled?: boolean; className?: string; type?: 'button' | 'submit'
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`no-select min-h-[48px] rounded-2xl px-5 py-3 font-bold text-lg shadow transition active:scale-95 disabled:opacity-40 disabled:active:scale-100 ${VARIANT[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

// ---------------------------------------------------------------------------
// 星星 / 點數
// ---------------------------------------------------------------------------

export function StarRow({ count, max = 3, size = 'text-3xl' }: { count: number; max?: number; size?: string }) {
  return (
    <div className={`flex gap-1 ${size}`}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={i < count ? 'text-star' : 'text-white/20'}>
          {i < count ? '⭐' : '☆'}
        </span>
      ))}
    </div>
  )
}

export function XpBar({ xp }: { xp: number }) {
  const { level, intoLevel, needForNext } = levelFromXp(xp)
  const pct = Math.min(100, Math.round((intoLevel / needForNext) * 100))
  return (
    <div className="flex items-center gap-2">
      <span className="shrink-0 rounded-full bg-pulse/30 px-2 py-0.5 text-sm font-bold text-pulse">Lv.{level}</span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-pulse transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="shrink-0 text-xs text-white/60">{intoLevel}/{needForNext}</span>
    </div>
  )
}

export function Coins({ value }: { value: number }) {
  return <span className="inline-flex items-center gap-1 font-bold text-star">🪙 {value}</span>
}

export function Streak({ days }: { days: number }) {
  return <span className="inline-flex items-center gap-1 font-bold text-quasar">🔥 {days}</span>
}

// ---------------------------------------------------------------------------
// 播音鈕
// ---------------------------------------------------------------------------

export function AudioButton({ text, audio, label, big }: { text?: string; audio?: string; label?: string; big?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => play({ text, audio })}
      className={`no-select inline-flex items-center gap-2 rounded-full bg-drift/20 text-drift active:scale-90 transition ${big ? 'px-5 py-3 text-2xl' : 'px-3 py-2 text-lg'}`}
      aria-label="播放語音"
    >
      🔊 {label && <span className="font-semibold">{label}</span>}
    </button>
  )
}

export function Pill({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>{children}</span>
}
