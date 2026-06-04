import { useState } from 'react'
import { useApp } from '../state/AppContext'
import { Screen, Card, Button } from '../components/ui'
import { LADDER, planetForGrade } from '../config/ladder'
import { avatarEmoji } from '../components/Hud'

const STARTER_AVATARS = ['👦', '👧', '🧒', '👨‍🚀', '🐱', '🦊', '🦄', '🤖']

export function ProfileSelect() {
  const { children, selectChild, createChild, removeChild } = useApp()
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [grade, setGrade] = useState(3)
  const [avatar, setAvatar] = useState(STARTER_AVATARS[0])

  const submit = async () => {
    if (!name.trim()) return
    await createChild({ name, grade, avatarEmoji: avatar })
    setName(''); setGrade(3); setAvatar(STARTER_AVATARS[0]); setAdding(false)
  }

  return (
    <Screen>
      <header className="mb-6 mt-6 text-center">
        <div className="text-6xl animate-float">🚀</div>
        <h1 className="mt-2 text-3xl font-extrabold">星河探險</h1>
        <p className="text-white/60">選擇你的星航員，開始英文冒險！</p>
      </header>

      {!adding && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {children.map((c) => {
              const planet = planetForGrade(c.grade)
              return (
                <Card key={c.id} className="relative p-4 text-center" onClick={editing ? undefined : () => selectChild(c.id)}>
                  <div className="text-5xl">{avatarEmoji(c, null)}</div>
                  <div className="mt-2 truncate font-bold">{c.name}</div>
                  <div className="text-xs text-white/50">{planet?.gradeLabel} · {planet?.planet} {planet?.planetName}</div>
                  {editing && (
                    <button
                      onClick={async (e) => { e.stopPropagation(); if (confirm(`要刪除「${c.name}」的所有進度嗎？`)) await removeChild(c.id) }}
                      className="absolute -right-2 -top-2 grid h-8 w-8 place-items-center rounded-full bg-red-400 text-space-900 font-bold shadow">✕</button>
                  )}
                </Card>
              )
            })}
            <Card className="grid place-items-center p-4 text-center" onClick={() => setAdding(true)}>
              <div className="text-5xl text-drift">＋</div>
              <div className="mt-2 font-bold text-drift">新增星航員</div>
            </Card>
          </div>

          {children.length > 0 && (
            <div className="mt-6 text-center">
              <button onClick={() => setEditing((e) => !e)} className="text-sm text-white/50 underline">
                {editing ? '完成' : '管理 / 刪除'}
              </button>
            </div>
          )}
        </>
      )}

      {adding && (
        <Card className="p-5">
          <h2 className="mb-4 text-center text-xl font-bold">新增星航員</h2>
          <label className="mb-1 block text-sm text-white/60">名字</label>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={12} placeholder="例如：小宇"
            className="mb-4 w-full rounded-xl bg-white/10 px-4 py-3 text-lg outline-none ring-2 ring-white/10 focus:ring-drift" />

          <label className="mb-1 block text-sm text-white/60">選一個頭像</label>
          <div className="mb-4 flex flex-wrap gap-2">
            {STARTER_AVATARS.map((a) => (
              <button key={a} onClick={() => setAvatar(a)}
                className={`no-select grid h-12 w-12 place-items-center rounded-xl text-2xl ring-2 transition active:scale-90 ${avatar === a ? 'bg-drift/30 ring-drift' : 'bg-white/5 ring-white/10'}`}>{a}</button>
            ))}
          </div>

          <label className="mb-1 block text-sm text-white/60">目前年級（決定起始星球，之後也能晉級）</label>
          <select value={grade} onChange={(e) => setGrade(Number(e.target.value))}
            className="mb-5 w-full rounded-xl bg-white/10 px-4 py-3 text-lg outline-none ring-2 ring-white/10 focus:ring-drift">
            {LADDER.map((p) => (
              <option key={p.grade} value={p.grade} className="bg-space-800">{p.gradeLabel}（{p.planet} {p.planetName} · {p.cefr}）</option>
            ))}
          </select>

          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setAdding(false)}>取消</Button>
            <Button variant="success" className="flex-1" disabled={!name.trim()} onClick={submit}>建立</Button>
          </div>
        </Card>
      )}
    </Screen>
  )
}
