// ============================================================================
// 課程內容型別（content schema）
// 課程內容全部放在 public/content/*.json，由 contentLoader 載入。
// 新增一課 = 新增一個 JSON 檔，不必改程式（見 README）。
// ============================================================================

export type Skill = 'listening' | 'speaking' | 'reading' | 'writing'

/** 練習支架程度：full=滿提示（引導）、partial=部分、none=無支架（檢核） */
export type HintLevel = 'full' | 'partial' | 'none'

/** 年齡分層：low=小一~二、mid=小三~六、teen=國高中 */
export type AgeTier = 'low' | 'mid' | 'teen'

export type CEFR = 'pre-A1' | 'A1' | 'A2' | 'B1' | 'B2'

/** 字彙雙軌：productive=應用字彙（須能拼寫使用）、receptive=認識字彙（能辨識理解） */
export type VocabKind = 'productive' | 'receptive'

/** 課堂六階段（warm-up 與 reward 由系統產生，不放在 JSON） */
export type LessonPhase = 'guided' | 'independent' | 'check'

// ---------------------------------------------------------------------------
// 基本素材
// ---------------------------------------------------------------------------

export interface VocabItem {
  /** 英文字（同時當作 SRS 的 wordId） */
  word: string
  /** 中文意思 */
  zh: string
  kind: VocabKind
  /** 用 emoji 當圖卡（零素材即可顯示） */
  emoji?: string
  /** 可選：圖檔路徑，存在時覆蓋 emoji */
  image?: string
  /** 可選：預錄 mp3 路徑，存在時覆蓋即時 TTS */
  audio?: string
  /** 例句 */
  example?: string
}

export interface SentenceItem {
  text: string
  zh?: string
  audio?: string
}

/** 學習階段（Learn）呈現的教學卡 */
export type TeachingCard =
  | { kind: 'vocab'; vocab: VocabItem }
  | { kind: 'sentence'; sentence: SentenceItem }
  | { kind: 'phonics'; focus: string; grapheme: string; sound: string; examples: string[] }
  | { kind: 'culture'; title: string; emoji?: string; text: string }
  | { kind: 'dialogue'; lines: { speaker: string; text: string; zh?: string }[] }

// ---------------------------------------------------------------------------
// 練習題型（discriminated union，判別欄位為 type）
// ---------------------------------------------------------------------------

interface ExerciseBase {
  id: string
  skill: Skill
  phase: LessonPhase
  points: number
  hintLevel?: HintLevel
  /** 中文輔助題幹（家長端用，孩子端可關） */
  promptZh?: string
}

export interface OptionItem {
  id: string
  text?: string
  emoji?: string
  image?: string
}

/** 選擇題 */
export type McqExercise = ExerciseBase & {
  type: 'mcq'
  prompt: string
  /** 朗讀用英文（聽力題時用） */
  audioText?: string
  options: OptionItem[]
  answerId: string
  explain?: string
}

/** 聽音選圖（低年級無字化主力）：播放英文 → 選 emoji/圖 */
export type ListenChooseExercise = ExerciseBase & {
  type: 'listen-choose'
  skill: 'listening'
  audioText: string
  options: OptionItem[]
  answerId: string
}

/** 配對：左欄（音/圖/字）對右欄（字/圖），可給部分分 */
export type MatchingExercise = ExerciseBase & {
  type: 'matching'
  pairs: {
    id: string
    left: { text?: string; emoji?: string; audioText?: string }
    right: { text?: string; emoji?: string }
  }[]
}

/** 填空（單一空格 + 可選詞庫） */
export type FillInExercise = ExerciseBase & {
  type: 'fill-in'
  /** 用 ___ 標示空格，例如 "Hello! I'm ___." */
  prompt: string
  audioText?: string
  acceptableAnswers: string[]
  /** 是否正規化比對（忽略大小寫/標點/前後空白 + Levenshtein≤1 容錯） */
  normalize?: boolean
  /** 可點選的詞庫（低年級） */
  wordBank?: string[]
}

/** 句子排序：tokens 以「正確順序」儲存，執行時打散 */
export type OrderingExercise = ExerciseBase & {
  type: 'ordering'
  tokens: string[]
  audioText?: string
}

/** 拼字：type=打字、tiles=拖字母 */
export type SpellingExercise = ExerciseBase & {
  type: 'spelling'
  word: string
  zh?: string
  emoji?: string
  mode: 'type' | 'tiles'
  audioText?: string
}

/** 口說錄音（不靠機器辨識）：錄音回放 + 自評星 */
export type SpeakExercise = ExerciseBase & {
  type: 'speak'
  skill: 'speaking'
  target: string
  zh?: string
  /** repeat-required=必做跟讀（列入完課，不計分）、free-bonus=加分自由說 */
  mode: 'repeat-required' | 'free-bonus'
}

/** 閱讀理解：一段短文 + 多題選擇 */
export type ReadingExercise = ExerciseBase & {
  type: 'reading'
  skill: 'reading'
  passage: string
  passageZh?: string
  questions: { id: string; prompt: string; options: OptionItem[]; answerId: string }[]
}

export type Exercise =
  | McqExercise
  | ListenChooseExercise
  | MatchingExercise
  | FillInExercise
  | OrderingExercise
  | SpellingExercise
  | SpeakExercise
  | ReadingExercise

export type ExerciseType = Exercise['type']

// ---------------------------------------------------------------------------
// 課 / 單元 / manifest
// ---------------------------------------------------------------------------

/** 第④段 Input：分級/可解碼閱讀短文（閱讀階梯引擎），只用已學過的字，i+1、可懂約 90% */
export interface ReadingInput {
  passage: string
  passageZh?: string
  audio?: string
  questions?: { id: string; prompt: string; promptZh?: string; options: OptionItem[]; answerId: string }[]
}

/** 第⑤段 Production：用目標語言完成的開放產出任務（口說或書寫），對應一條 can-do */
export interface ProductionTask {
  mode: 'speak' | 'write'
  prompt: string
  promptZh?: string
  example?: string
  canDo?: string
}

export interface Lesson {
  schemaVersion: number
  id: string
  unitId: string
  title: string
  titleEn?: string
  grade: number
  /** 規格階段 S1–S5 */
  stage: string
  cefr: CEFR
  ageTier: AgeTier
  estMinutes: number
  phonicsFocus?: string
  softSkillFocus?: string
  curriculumCodes: string[]
  /** can-do 學習目標（對應規格 §7） */
  objectives: string[]
  vocabulary: VocabItem[]
  sentences: SentenceItem[]
  /** 第② Presentation：教學卡 */
  teaching: TeachingCard[]
  /** 第③ Controlled Practice：guided + independent 題；第⑥ Review/Check：check 題 */
  exercises: Exercise[]
  /** 第④ Input：分級閱讀短文（可選） */
  input?: ReadingInput
  /** 第⑤ Production：開放產出任務（可選） */
  production?: ProductionTask
}

/** 測驗（單元複習 review / 晉級守門 promotion） */
export interface QuizDef {
  schemaVersion: number
  id: string
  unitId: string
  kind: 'review' | 'promotion'
  title: string
  /** 通過門檻（0..1） */
  passThreshold: number
  /** 各技能最低門檻（0..1），key 為 Skill */
  skillFloors?: Partial<Record<Skill, number>>
  items: Exercise[]
}

/** 單元（一個航段，含數課 + 複習 + 晉級測驗） */
export interface UnitRef {
  id: string
  title: string
  grade: number
  cefr: CEFR
  planetEmoji: string
  lessonFiles: string[]
  reviewFile?: string
  promotionFile?: string
}

export interface ContentManifest {
  schemaVersion: number
  units: UnitRef[]
}
