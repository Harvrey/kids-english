# 🚀 星河探險 · 兒童英文自學 Web App

給小孩（小一到高三）的英文自學樂園。對齊台灣 **108 課綱 + CEFR** 架構，每堂 30 分鐘（學習＋練習），用 **點數／星星／徽章** 收集機制與 **晉級測驗** 推進；純前端、可離線（PWA）。

> 第一版垂直切片：**小三第 1 航段「Hello, Friends!」**（5 課 + 單元複習 + 晉級測驗），並含小四骨架示範。全部機制（多人檔案、XP/星/金幣、商店、徽章、連續天數、晉級測驗、字彙 SRS、匯出匯入）皆已串通。

---

## 快速開始

```bash
npm install      # 安裝相依套件
npm run dev      # 本機開發（瀏覽器開 http://localhost:5173）
npm run build    # 產出純靜態網站到 dist/
npm run preview  # 預覽 build 結果
npm test         # 跑核心邏輯單元測試（批改 / SRS / 晉級門檻）
npm run validate-content   # 驗證課程 JSON 格式與資產
```

## 部署

`npm run build` 會輸出純靜態檔到 `dist/`，可直接丟到任何靜態主機：

- **Netlify / Vercel**：拖曳 `dist/` 或連結 repo，build 指令 `npm run build`、發佈目錄 `dist`。
- **GitHub Pages（專案頁）**：把 `vite.config.ts` 的 `base: './'` 改成 `base: '/你的repo名/'` 再 build。
- **本機**：`npm run preview`，或用任意靜態伺服器開 `dist/`。

> ⚠️ 純前端 = 資料只存在「這台裝置」。換裝置/清快取前，請到「設定 → 下載備份」。匯入為「覆蓋還原」，不是多裝置即時同步。

---

## 專案結構

```
kids-english/
├─ public/content/         # ★ 課程內容（JSON）— 新增課程改這裡，不用動程式
│  ├─ manifest.json        #   單元清單（登錄每個 unit 與其課程/測驗檔）
│  └─ elementary/g3/g3-u01/{lesson-01..05,review,promotion}.json
├─ scripts/validate-content.mjs   # 內容格式 + 資產存在性驗證
└─ src/
   ├─ types/        content.ts（題型 discriminated union）/ profile.ts
   ├─ config/       ladder（年級↔CEFR↔星球）/ levels（XP/星）/ badges / shop / encourage
   ├─ data/         db（IndexedDB）+ 各 repository + backup（匯出匯入）
   ├─ game/         grade（批改）/ srs（間隔重複）/ promotion（晉級門檻）/ pointsService / sessionFlow
   │                + *.test.ts（單元測試）
   ├─ content/      contentLoader（抓 manifest/課程/測驗）
   ├─ audio/        tts（即時發音；有 mp3 則優先播 mp3）
   ├─ components/   ui / Hud / ExerciseInput（7 題型）/ ExerciseView / SrsReview
   └─ pages/        ProfileSelect / Dashboard / Lesson / Quiz / Shop / SrsPage / Settings
```

---

## ✍️ 如何新增一課（給非工程師）

1. 在 `public/content/` 下新增一個 `lesson-XX.json`（可複製現成的當範本）。
2. 到 `public/content/manifest.json`，把新檔案路徑加進對應 unit 的 `lessonFiles`。
3. 執行 `npm run validate-content` 確認格式正確。
4. `npm run dev` 看效果。

### 課程 JSON 重點欄位

```jsonc
{
  "schemaVersion": 1,
  "id": "g3-u01-l01",          // 全站唯一
  "unitId": "g3-u01",
  "title": "打招呼 Greetings",
  "grade": 3, "stage": "階段Ⅱ", "cefr": "A1", "ageTier": "mid",
  "estMinutes": 30,
  "phonicsFocus": "letter sound: h /h/",
  "curriculumCodes": ["2-Ⅱ-1"],   // 對齊 108 課綱編碼
  "objectives": ["..."],
  "vocabulary": [{ "word": "hello", "zh": "你好", "kind": "productive", "emoji": "👋" }],
  "sentences": [{ "text": "Hello!", "zh": "哈囉！" }],
  "teaching": [ { "kind": "vocab", "vocab": { ... } }, { "kind": "phonics", ... } ],
  "exercises": [ /* 見下方題型 */ ]
}
```

- `kind`：`productive`=應用字彙（要會拼寫）、`receptive`=認識字彙（會辨識）。
- `emoji`：當圖卡用（零素材即可）；要換真圖就填 `image` 路徑。
- `audio`：填預錄 mp3 路徑就會「優先播 mp3」，否則用即時 TTS 發音。

### 題型（每題都要 `id` / `skill` / `phase` / `points`）

`phase`：`guided`（有提示）→ `independent`（自主）→ `check`（無提示、決定星等）。

| type | 說明 | 關鍵欄位 |
|---|---|---|
| `mcq` | 選擇題 | `prompt`, `options[]`, `answerId`, 可加 `audioText` |
| `listen-choose` | 聽音選圖（低年級無字化） | `audioText`, `options[]`(emoji), `answerId` |
| `matching` | 配對（可部分分） | `pairs[]`(left/right) |
| `fill-in` | 填空（容錯比對） | `prompt`(用 `___`), `acceptableAnswers[]`, 可加 `wordBank[]` |
| `ordering` | 句子排序 | `tokens[]`（用正確順序填，系統會打散） |
| `spelling` | 拼字 | `word`, `mode`: `tiles`(拖字母)/`type`(打字) |
| `speak` | 口說錄音（不計分） | `target`, `mode`: `repeat-required`/`free-bonus` |
| `reading` | 閱讀理解 | `passage`, `questions[]` |

測驗檔（`review.json` / `promotion.json`）格式同上，外層加 `kind`、`passThreshold`、可選 `skillFloors`，題目放在 `items[]`。

---

## 設計重點（對應討論計劃 v2）

- **學習階梯**：12 年級 = 12 星球、分 4 星系；跨星系需通過晉級測驗。
- **六階段課堂**：暖身(SRS 複習)→學習→引導→自主→小檢核(定星)→結算。
- **遊戲化但拒絕黑暗模式**：答錯也給 XP、不扣分、無付費、無強迫連勝、預設不公開排行。
- **晉級測驗**：總分門檻 + 各技能地板（低年級較寬、「寫」不設硬地板）、失敗冷卻 + 先複習再重試。
- **字彙 SRS**：簡化 SM-2，暖身做「今日回收」。
- **無後端**：IndexedDB 多人檔案 + 匯出/覆蓋還原備份；PWA 離線。

> 字彙量等課綱數字仍標註「待回查領綱」，請於正式內容前以《十二年國教英語文領綱》原文校對。
