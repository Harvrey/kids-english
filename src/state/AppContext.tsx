import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Child, PointsState, LessonProgress, UnitProgress } from '../types/profile'
import { listChildren, createChild as repoCreate, deleteChild as repoDelete, updateChild as repoUpdate } from '../data/childRepository'
import { getPoints, savePoints as repoSavePoints } from '../data/pointsRepository'
import { listLessonProgress, listUnitProgress } from '../data/progressRepository'
import { requestPersistentStorage } from '../data/db'
import { applyStreak } from '../game/pointsService'

export type View =
  | { name: 'profile' }
  | { name: 'dashboard' }
  | { name: 'lesson'; unitId: string; lessonFile: string }
  | { name: 'quiz'; unitId: string; quizFile: string; kind: 'review' | 'promotion' }
  | { name: 'srs' }
  | { name: 'shop' }
  | { name: 'settings' }

interface AppState {
  loading: boolean
  children: Child[]
  activeChild: Child | null
  points: PointsState | null
  lessonProgress: Record<string, LessonProgress>
  unitProgress: Record<string, UnitProgress>
  view: View
  showZh: boolean

  navigate: (v: View) => void
  setShowZh: (v: boolean) => void
  reloadProfiles: () => Promise<void>
  selectChild: (id: string) => Promise<void>
  exitChild: () => void
  createChild: (input: { name: string; grade: number; avatarEmoji?: string }) => Promise<void>
  removeChild: (id: string) => Promise<void>
  saveActiveChild: (child: Child) => Promise<void>
  savePoints: (p: PointsState) => Promise<void>
  refreshActive: () => Promise<void>
}

const Ctx = createContext<AppState | null>(null)
const ACTIVE_KEY = 'kids-english.activeChildId'

export function AppProvider({ children: kids }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [childList, setChildList] = useState<Child[]>([])
  const [activeChild, setActiveChild] = useState<Child | null>(null)
  const [points, setPoints] = useState<PointsState | null>(null)
  const [lessonProgress, setLessonProgress] = useState<Record<string, LessonProgress>>({})
  const [unitProgress, setUnitProgress] = useState<Record<string, UnitProgress>>({})
  const [view, setView] = useState<View>({ name: 'profile' })
  const [showZh, setShowZh] = useState<boolean>(true)

  const loadActiveData = useCallback(async (child: Child) => {
    const [pts, lp, up] = await Promise.all([
      getPoints(child.id),
      listLessonProgress(child.id),
      listUnitProgress(child.id),
    ])
    setLessonProgress(Object.fromEntries(lp.map((x) => [x.lessonId, x])))
    setUnitProgress(Object.fromEntries(up.map((x) => [x.unitId, x])))
    setPoints(pts)
    return pts
  }, [])

  const reloadProfiles = useCallback(async () => {
    const list = await listChildren()
    setChildList(list)
    return
  }, [])

  const refreshActive = useCallback(async () => {
    if (!activeChild) return
    await loadActiveData(activeChild)
  }, [activeChild, loadActiveData])

  const selectChild = useCallback(async (id: string) => {
    const child = childList.find((c) => c.id === id)
    if (!child) return
    localStorage.setItem(ACTIVE_KEY, id)
    setActiveChild(child)
    const pts = await loadActiveData(child)
    // 進入即更新連續天數
    const { points: streaked, increased } = applyStreak(pts)
    if (increased) {
      await repoSavePoints(streaked)
      setPoints(streaked)
    }
    setView({ name: 'dashboard' })
  }, [childList, loadActiveData])

  const exitChild = useCallback(() => {
    localStorage.removeItem(ACTIVE_KEY)
    setActiveChild(null)
    setPoints(null)
    setLessonProgress({})
    setUnitProgress({})
    setView({ name: 'profile' })
  }, [])

  const createChild = useCallback(async (input: { name: string; grade: number; avatarEmoji?: string }) => {
    await repoCreate(input)
    await reloadProfiles()
  }, [reloadProfiles])

  const removeChild = useCallback(async (id: string) => {
    await repoDelete(id)
    if (activeChild?.id === id) exitChild()
    await reloadProfiles()
  }, [activeChild, exitChild, reloadProfiles])

  const saveActiveChild = useCallback(async (child: Child) => {
    await repoUpdate(child)
    setActiveChild(child)
    await reloadProfiles()
  }, [reloadProfiles])

  const savePoints = useCallback(async (p: PointsState) => {
    await repoSavePoints(p)
    setPoints(p)
  }, [])

  // 初始載入
  useEffect(() => {
    (async () => {
      await requestPersistentStorage()
      const list = await listChildren()
      setChildList(list)
      const savedId = localStorage.getItem(ACTIVE_KEY)
      const saved = savedId ? list.find((c) => c.id === savedId) : undefined
      if (saved) {
        setActiveChild(saved)
        const pts = await loadActiveData(saved)
        const { points: streaked, increased } = applyStreak(pts)
        if (increased) { await repoSavePoints(streaked); setPoints(streaked) }
        setView({ name: 'dashboard' })
      } else {
        setView({ name: 'profile' })
      }
      setLoading(false)
    })()
  }, [loadActiveData])

  const value = useMemo<AppState>(() => ({
    loading, children: childList, activeChild, points, lessonProgress, unitProgress, view, showZh,
    navigate: setView, setShowZh, reloadProfiles, selectChild, exitChild, createChild, removeChild,
    saveActiveChild, savePoints, refreshActive,
  }), [loading, childList, activeChild, points, lessonProgress, unitProgress, view, showZh,
    reloadProfiles, selectChild, exitChild, createChild, removeChild, saveActiveChild, savePoints, refreshActive])

  return <Ctx.Provider value={value}>{kids}</Ctx.Provider>
}

export function useApp(): AppState {
  const v = useContext(Ctx)
  if (!v) throw new Error('useApp 必須在 AppProvider 內使用')
  return v
}
