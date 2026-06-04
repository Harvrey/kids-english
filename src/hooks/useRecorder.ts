// ============================================================================
// 錄音 hook（口說題用）：MediaRecorder 存在本機記憶體，不上傳。
// ============================================================================

import { useCallback, useRef, useState } from 'react'

export interface RecorderState {
  supported: boolean
  recording: boolean
  audioUrl: string | null
  error: string | null
  start: () => Promise<void>
  stop: () => void
  reset: () => void
}

export function useRecorder(): RecorderState {
  const supported = typeof navigator !== 'undefined' && !!navigator.mediaDevices && typeof MediaRecorder !== 'undefined'
  const [recording, setRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  const start = useCallback(async () => {
    setError(null)
    if (!supported) { setError('此裝置不支援錄音'); return }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const rec = new MediaRecorder(stream)
      chunksRef.current = []
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(blob) })
        stream.getTracks().forEach((t) => t.stop())
      }
      rec.start()
      recorderRef.current = rec
      setRecording(true)
    } catch {
      setError('沒有麥克風權限，可以先用「家長一起說」的方式跟著念喔！')
    }
  }, [supported])

  const stop = useCallback(() => {
    const rec = recorderRef.current
    if (rec && rec.state !== 'inactive') rec.stop()
    setRecording(false)
  }, [])

  const reset = useCallback(() => {
    setAudioUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null })
    setError(null)
  }, [])

  return { supported, recording, audioUrl, error, start, stop, reset }
}
