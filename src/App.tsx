import { useEffect } from 'react'
import { useApp } from './state/AppContext'
import { ProfileSelect } from './pages/ProfileSelect'
import { Dashboard } from './pages/Dashboard'
import { Lesson } from './pages/Lesson'
import { Quiz } from './pages/Quiz'
import { SrsPage } from './pages/SrsPage'
import { Shop } from './pages/Shop'
import { Settings } from './pages/Settings'
import { setAudioEnabled, setSpeechRate } from './audio/tts'

export default function App() {
  const { loading, view } = useApp()

  // 套用使用者偏好設定
  useEffect(() => {
    const audio = localStorage.getItem('kids-english.audio')
    if (audio === '0') setAudioEnabled(false)
    const scale = localStorage.getItem('kids-english.uiScale')
    if (scale) document.documentElement.style.setProperty('--ui-scale', scale)
    setSpeechRate(0.85)
  }, [])

  if (loading) {
    return (
      <div className="starfield grid min-h-full place-items-center">
        <div className="relative z-10 text-center">
          <div className="text-6xl animate-float">🚀</div>
          <div className="mt-3 text-white/60">星河探險載入中…</div>
        </div>
      </div>
    )
  }

  switch (view.name) {
    case 'profile': return <ProfileSelect />
    case 'dashboard': return <Dashboard />
    case 'lesson': return <Lesson unitId={view.unitId} lessonFile={view.lessonFile} />
    case 'quiz': return <Quiz unitId={view.unitId} quizFile={view.quizFile} kind={view.kind} />
    case 'srs': return <SrsPage />
    case 'shop': return <Shop />
    case 'settings': return <Settings />
  }
}
