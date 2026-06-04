import { useRef, useState, type ReactNode } from 'react'
import { useApp } from '../state/AppContext'
import { Screen, Card, Button } from '../components/ui'
import { downloadBackup, readBackupFile, importOverwrite } from '../data/backup'
import { setAudioEnabled, isAudioEnabled, setSpeechRate } from '../audio/tts'
import { requestPersistentStorage } from '../data/db'

const SCALE_KEY = 'kids-english.uiScale'
const AUDIO_KEY = 'kids-english.audio'

export function Settings() {
  const { activeChild, showZh, setShowZh, navigate, exitChild, removeChild } = useApp()
  const [audioOn, setAudioOn] = useState(isAudioEnabled())
  const [scale, setScale] = useState<number>(Number(localStorage.getItem(SCALE_KEY) ?? '1'))
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const toggleAudio = (v: boolean) => { setAudioOn(v); setAudioEnabled(v); localStorage.setItem(AUDIO_KEY, v ? '1' : '0') }
  const changeScale = (v: number) => { setScale(v); document.documentElement.style.setProperty('--ui-scale', String(v)); localStorage.setItem(SCALE_KEY, String(v)) }

  const onImport = async (file: File) => {
    if (!confirm('匯入會「覆蓋」目前裝置上所有小孩的進度，確定嗎？建議先下載備份。')) return
    try {
      setBusy(true)
      const bundle = await readBackupFile(file)
      await importOverwrite(bundle)
      alert('匯入完成！將重新整理。')
      location.reload()
    } catch (e) {
      alert('匯入失敗：' + (e instanceof Error ? e.message : '未知錯誤'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen>
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => navigate({ name: 'dashboard' })} className="no-select grid h-10 w-10 place-items-center rounded-full bg-white/10 text-lg active:scale-90">←</button>
        <h1 className="text-xl font-bold">⚙️ 設定</h1>
      </div>

      <Card className="mb-4 divide-y divide-white/10 p-1">
        <Row label="顯示中文提示" hint="關掉可挑戰全英文">
          <Toggle on={showZh} onChange={setShowZh} />
        </Row>
        <Row label="語音 / 發音" hint="關掉就靜音">
          <Toggle on={audioOn} onChange={toggleAudio} />
        </Row>
        <Row label="說話速度" hint="幫助聽清楚每個字">
          <select defaultValue="0.85" onChange={(e) => setSpeechRate(Number(e.target.value))}
            className="rounded-lg bg-white/10 px-3 py-2 ring-1 ring-white/10">
            <option value="0.7" className="bg-space-800">慢</option>
            <option value="0.85" className="bg-space-800">適中</option>
            <option value="1" className="bg-space-800">正常</option>
          </select>
        </Row>
        <Row label="字體大小" hint="">
          <div className="flex gap-1">
            {[0.9, 1, 1.15, 1.3].map((s) => (
              <button key={s} onClick={() => changeScale(s)}
                className={`no-select h-9 w-9 rounded-lg text-sm font-bold ring-2 ${scale === s ? 'bg-drift/30 ring-drift' : 'bg-white/5 ring-white/10'}`}>A</button>
            ))}
          </div>
        </Row>
      </Card>

      <Card className="mb-4 p-4">
        <h2 className="mb-1 font-bold">💾 備份與還原</h2>
        <p className="mb-3 text-xs text-white/50">純前端 App，資料只存在這台裝置。換裝置或清資料前，請先下載備份。匯入為「覆蓋還原」，非多裝置同步。</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => downloadBackup()}>⬇️ 下載備份</Button>
          <Button variant="ghost" disabled={busy} onClick={() => fileRef.current?.click()}>⬆️ 匯入備份（覆蓋）</Button>
          <Button variant="ghost" onClick={async () => alert((await requestPersistentStorage()) ? '已要求瀏覽器保留資料 ✅' : '此瀏覽器未支援或未授予持久化')}>🔒 保留資料</Button>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); e.target.value = '' }} />
      </Card>

      <Card className="mb-4 p-4">
        <h2 className="mb-2 font-bold">👦 目前星航員：{activeChild?.name}</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={exitChild}>切換星航員</Button>
          <Button variant="danger" onClick={async () => { if (activeChild && confirm(`刪除「${activeChild.name}」的所有進度？此動作無法復原。`)) await removeChild(activeChild.id) }}>刪除此星航員</Button>
        </div>
      </Card>

      <Card className="p-4 text-xs text-white/50">
        <h2 className="mb-1 text-sm font-bold text-white/70">關於</h2>
        <p>星河探險 v0.1 · 對齊台灣 108 課綱 + CEFR 架構（字彙數字仍待回查領綱，僅供參考）。</p>
        <p className="mt-1">原型發音採用瀏覽器即時語音；正式版可替換為預錄音檔。</p>
      </Card>
    </Screen>
  )
}

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 p-3">
      <div><div className="font-semibold">{label}</div>{hint && <div className="text-xs text-white/40">{hint}</div>}</div>
      {children}
    </div>
  )
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} className={`no-select relative h-8 w-14 rounded-full transition ${on ? 'bg-nova' : 'bg-white/20'}`}>
      <span className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-all ${on ? 'left-7' : 'left-1'}`} />
    </button>
  )
}
