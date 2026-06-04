// ============================================================================
// 語音播放：優先播放預錄 mp3（若內容提供 audio 路徑），否則用瀏覽器即時 TTS。
// 為兒童放慢語速、選英語語音。
// ============================================================================

let cachedVoices: SpeechSynthesisVoice[] = []
let enabled = true
let rate = 0.85

export function setAudioEnabled(v: boolean) { enabled = v }
export function isAudioEnabled() { return enabled }
export function setSpeechRate(r: number) { rate = r }

function loadVoices(): SpeechSynthesisVoice[] {
  if (typeof speechSynthesis === 'undefined') return []
  if (cachedVoices.length) return cachedVoices
  cachedVoices = speechSynthesis.getVoices()
  return cachedVoices
}

if (typeof speechSynthesis !== 'undefined') {
  // 部分瀏覽器 voices 為非同步載入
  speechSynthesis.onvoiceschanged = () => { cachedVoices = speechSynthesis.getVoices() }
}

function pickEnglishVoice(): SpeechSynthesisVoice | undefined {
  const voices = loadVoices()
  return (
    voices.find((v) => /en[-_]US/i.test(v.lang) && /female|samantha|google/i.test(v.name)) ||
    voices.find((v) => /^en/i.test(v.lang)) ||
    undefined
  )
}

/** 用 TTS 朗讀英文 */
export function speak(text: string): void {
  if (!enabled || !text) return
  if (typeof speechSynthesis === 'undefined') return
  try {
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-US'
    u.rate = rate
    u.pitch = 1.05
    const v = pickEnglishVoice()
    if (v) u.voice = v
    speechSynthesis.speak(u)
  } catch {
    /* 忽略不支援的環境 */
  }
}

/** 播放一個素材：有 mp3 用 mp3，否則 TTS 朗讀 text */
export function play(opts: { text?: string; audio?: string }): void {
  if (!enabled) return
  if (opts.audio) {
    try {
      const a = new Audio(opts.audio)
      a.play().catch(() => { if (opts.text) speak(opts.text) })
      return
    } catch {
      /* fallthrough to TTS */
    }
  }
  if (opts.text) speak(opts.text)
}

export function stopSpeaking(): void {
  if (typeof speechSynthesis !== 'undefined') {
    try { speechSynthesis.cancel() } catch { /* ignore */ }
  }
}
