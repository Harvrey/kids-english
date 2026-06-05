export const meta = {
  name: 'author-kids-lessons',
  description: '並行撰寫小三/小四加厚版英文課程 JSON（108課綱 A1、每課約12題、含聽說讀寫+口說）',
  phases: [{ title: 'Author', detail: '一個代理寫一堂課，輸出符合 schema 的 JSON' }],
}

const SPEC = `
你要產出「一堂兒童英文課」的 JSON（給小三/小四自學 web app 用，CEFR A1）。
【最重要】只輸出「合法 JSON 物件」本身，不要任何 markdown 圍欄、不要說明文字。

每堂課要「飽」（30 分鐘份量）：教學卡 9~11 張、練習題 12 題（含 1 題口說）。

JSON 結構與規則（務必完全遵守欄位名稱）：
{
  "schemaVersion": 1,
  "id": "<給定>",
  "unitId": "<給定>",
  "title": "<給定中文 英文>",
  "titleEn": "<英文標題>",
  "grade": <給定數字>,
  "stage": "階段Ⅱ",
  "cefr": "A1",
  "ageTier": "mid",
  "estMinutes": 30,
  "phonicsFocus": "letter sound: <字母> /<音>/（挑一個單字的字首音）",
  "softSkillFocus": "<一句中文，例如：表達喜好>",
  "curriculumCodes": ["2-Ⅱ-1", "Ac-Ⅱ-2"],
  "objectives": ["<中文學習目標1>", "<中文學習目標2>"],
  "vocabulary": [ {"word":"dog","zh":"狗","kind":"productive","emoji":"🐶","example":"I have a dog."}, ... 用「給定的單字清單」，每個都要 ],
  "sentences": [ {"text":"This is my dog.","zh":"這是我的狗。"}, ...共3句，用 A1 簡單句、用到本課單字 ],
  "teaching": [
    {"kind":"vocab","vocab":{"word":"dog","zh":"狗","kind":"productive","emoji":"🐶"}},  // 每個單字一張
    {"kind":"sentence","sentence":{"text":"This is my dog.","zh":"這是我的狗。"}},          // 2~3 張
    {"kind":"phonics","focus":"d /d/","grapheme":"d","sound":"/d/","examples":["dog","desk","door"]}  // 1 張
  ],
  "exercises": [
    // 引導 guided（3 題，hintLevel:"full"）：listen-choose、matching、mcq
    {"type":"listen-choose","id":"<id>-g1","skill":"listening","phase":"guided","points":10,"hintLevel":"full","audioText":"dog","promptZh":"聽 dog，選對的圖","options":[{"id":"a","emoji":"🐶"},{"id":"b","emoji":"🐱"}],"answerId":"a"},
    {"type":"matching","id":"<id>-g2","skill":"reading","phase":"guided","points":15,"hintLevel":"full","promptZh":"把單字和圖配對","pairs":[{"id":"p1","left":{"text":"dog","audioText":"dog"},"right":{"emoji":"🐶"}},{"id":"p2","left":{"text":"cat","audioText":"cat"},"right":{"emoji":"🐱"}},{"id":"p3","left":{"text":"fish","audioText":"fish"},"right":{"emoji":"🐟"}}]},
    {"type":"mcq","id":"<id>-g3","skill":"reading","phase":"guided","points":10,"hintLevel":"full","prompt":"🐶 的英文是？","options":[{"id":"a","text":"dog"},{"id":"b","text":"cat"}],"answerId":"a"},
    // 自主 independent（5 題）：listen-choose、fill-in(含 wordBank)、ordering、spelling(tiles)、speak
    {"type":"listen-choose","id":"<id>-i1","skill":"listening","phase":"independent","points":10,"audioText":"cat","promptZh":"聽英文選圖","options":[{"id":"a","emoji":"🐶"},{"id":"b","emoji":"🐱"},{"id":"c","emoji":"🐟"}],"answerId":"b"},
    {"type":"fill-in","id":"<id>-i2","skill":"writing","phase":"independent","points":10,"prompt":"I have a ___.","promptZh":"填入單字","acceptableAnswers":["dog"],"wordBank":["dog","cat","fish"]},
    {"type":"ordering","id":"<id>-i3","skill":"reading","phase":"independent","points":15,"promptZh":"排出句子","tokens":["This","is","my","dog"]},
    {"type":"spelling","id":"<id>-i4","skill":"writing","phase":"independent","points":15,"word":"cat","zh":"貓","emoji":"🐱","mode":"tiles"},
    {"type":"speak","id":"<id>-i5","skill":"speaking","phase":"independent","points":5,"target":"I have a dog and a cat.","zh":"我有一隻狗和一隻貓。","mode":"repeat-required"},
    // 檢核 check（4 題，無提示）：listen-choose、mcq、spelling(tiles)、matching；要涵蓋 聽/讀/寫
    {"type":"listen-choose","id":"<id>-c1","skill":"listening","phase":"check","points":10,"audioText":"fish","promptZh":"（聽英文選圖）","options":[{"id":"a","emoji":"🐶"},{"id":"b","emoji":"🐟"},{"id":"c","emoji":"🐱"},{"id":"d","emoji":"🐰"}],"answerId":"b"},
    {"type":"mcq","id":"<id>-c2","skill":"reading","phase":"check","points":10,"prompt":"🐱 的英文是？","options":[{"id":"a","text":"dog"},{"id":"b","text":"cat"},{"id":"c","text":"fish"}],"answerId":"b"},
    {"type":"spelling","id":"<id>-c3","skill":"writing","phase":"check","points":15,"word":"dog","zh":"狗","emoji":"🐶","mode":"tiles"},
    {"type":"matching","id":"<id>-c4","skill":"reading","phase":"check","points":15,"promptZh":"配對","pairs":[{"id":"p1","left":{"text":"dog"},"right":{"emoji":"🐶"}},{"id":"p2","left":{"text":"cat"},"right":{"emoji":"🐱"}},{"id":"p3","left":{"text":"fish"},"right":{"emoji":"🐟"}}]}
  ]
}

嚴格規則：
- 只能用「給定的單字清單」當核心單字；emoji 用清單給的，listen-choose 的選項只放 emoji（含正解＋同主題誘答），answerId 必須對應正解選項的 id。
- 每題 id 用「課程 id + 後綴」如 "g3-u02-l01-g1"，全課唯一；選項 id 用 a/b/c/d；配對 pair id 用 p1/p2/p3。
- matching 的 left 用英文字（可加 audioText），right 用 emoji 或中文；左右是同一個 pair.id 才算對。
- fill-in 的 prompt 一定要含 "___"；acceptableAnswers 要含正解；低年級給 wordBank。
- ordering 的 tokens 用「正確順序」（系統會自動打散）。
- spelling 用 mode:"tiles"，word 用小寫。
- 句子與例句用 A1 等級、簡單、正確的英文，且用到本課單字。
- 不要加 schema 沒有的欄位。再次強調：只輸出 JSON 本身。
`

// 課程清單（curriculum）。l01 of g3-u01 由人工維護，不在此重寫。
const LESSONS = [
  // ===== 小三 U01（重寫 l02~l05，加厚）=====
  { file: 'elementary/g3/g3-u01/lesson-02.json', id: 'g3-u01-l02', unitId: 'g3-u01', grade: 3, title: '你叫什麼名字？ Names', titleEn: "What's your name?", theme: '名字與自我介紹',
    vocab: [['name','名字','productive','🏷️'],['friend','朋友','productive','🧑‍🤝‍🧑'],['nice','友善的','receptive','😊'],['boy','男孩','productive','👦'],['girl','女孩','productive','👧'],['teacher','老師','receptive','👩‍🏫']] },
  { file: 'elementary/g3/g3-u01/lesson-03.json', id: 'g3-u01-l03', unitId: 'g3-u01', grade: 3, title: '你好嗎？ Feelings', titleEn: 'How are you?', theme: '心情感受',
    vocab: [['happy','開心的','productive','😊'],['sad','難過的','productive','😢'],['fine','很好','productive','🙂'],['tired','累的','receptive','😴'],['angry','生氣的','receptive','😠'],['hungry','餓的','receptive','🍔']] },
  { file: 'elementary/g3/g3-u01/lesson-04.json', id: 'g3-u01-l04', unitId: 'g3-u01', grade: 3, title: '數一數 Numbers', titleEn: 'Numbers 1–10', theme: '數字 1-10',
    vocab: [['one','一','productive','1️⃣'],['two','二','productive','2️⃣'],['three','三','productive','3️⃣'],['four','四','productive','4️⃣'],['five','五','productive','5️⃣'],['ten','十','receptive','🔟']] },
  { file: 'elementary/g3/g3-u01/lesson-05.json', id: 'g3-u01-l05', unitId: 'g3-u01', grade: 3, title: '繽紛顏色 Colors', titleEn: 'Colors', theme: '顏色',
    vocab: [['red','紅色','productive','🔴'],['blue','藍色','productive','🔵'],['yellow','黃色','productive','🟡'],['green','綠色','productive','🟢'],['purple','紫色','receptive','🟣'],['pink','粉紅色','receptive','🩷']] },
  // ===== 小三 U02 My World =====
  { file: 'elementary/g3/g3-u02/lesson-01.json', id: 'g3-u02-l01', unitId: 'g3-u02', grade: 3, title: '我的家人 Family', titleEn: 'My Family', theme: '家人',
    vocab: [['father','爸爸','productive','👨'],['mother','媽媽','productive','👩'],['brother','哥哥/弟弟','productive','👦'],['sister','姐姐/妹妹','productive','👧'],['baby','寶寶','receptive','👶'],['grandma','奶奶','receptive','👵']] },
  { file: 'elementary/g3/g3-u02/lesson-02.json', id: 'g3-u02-l02', unitId: 'g3-u02', grade: 3, title: '我的身體 Body', titleEn: 'My Body', theme: '身體部位',
    vocab: [['hand','手','productive','✋'],['eye','眼睛','productive','👁️'],['ear','耳朵','productive','👂'],['nose','鼻子','productive','👃'],['mouth','嘴巴','productive','👄'],['foot','腳','receptive','🦶']] },
  { file: 'elementary/g3/g3-u02/lesson-03.json', id: 'g3-u02-l03', unitId: 'g3-u02', grade: 3, title: '動物朋友 Animals', titleEn: 'Animals', theme: '動物',
    vocab: [['dog','狗','productive','🐶'],['cat','貓','productive','🐱'],['bird','鳥','productive','🐦'],['fish','魚','productive','🐟'],['rabbit','兔子','receptive','🐰'],['lion','獅子','receptive','🦁']] },
  { file: 'elementary/g3/g3-u02/lesson-04.json', id: 'g3-u02-l04', unitId: 'g3-u02', grade: 3, title: '好吃的食物 Food', titleEn: 'Food & Fruit', theme: '食物水果',
    vocab: [['apple','蘋果','productive','🍎'],['banana','香蕉','productive','🍌'],['milk','牛奶','productive','🥛'],['bread','麵包','productive','🍞'],['egg','蛋','receptive','🥚'],['water','水','receptive','💧']] },
  { file: 'elementary/g3/g3-u02/lesson-05.json', id: 'g3-u02-l05', unitId: 'g3-u02', grade: 3, title: '教室裡 Classroom', titleEn: 'In the Classroom', theme: '教室物品',
    vocab: [['book','書','productive','📖'],['pen','筆','productive','🖊️'],['pencil','鉛筆','productive','✏️'],['bag','書包','productive','🎒'],['ruler','尺','receptive','📏'],['eraser','橡皮擦','receptive','🧽']] },
  // ===== 小四 U01 My Day（加厚，取代骨架）=====
  { file: 'elementary/g4/g4-u01/lesson-01.json', id: 'g4-u01-l01', unitId: 'g4-u01', grade: 4, title: '每天做什麼 Daily Actions', titleEn: 'Daily Actions', theme: '每日動作',
    vocab: [['eat','吃','productive','🍽️'],['sleep','睡覺','productive','😴'],['play','玩','productive','⚽'],['study','讀書','productive','📚'],['run','跑','receptive','🏃'],['jump','跳','receptive','🤸']] },
  { file: 'elementary/g4/g4-u01/lesson-02.json', id: 'g4-u01-l02', unitId: 'g4-u01', grade: 4, title: '我的一天 My Routine', titleEn: 'My Routine', theme: '作息與時間',
    vocab: [['morning','早上','productive','🌅'],['noon','中午','productive','🌞'],['night','晚上','productive','🌙'],['school','學校','productive','🏫'],['home','家','productive','🏠'],['breakfast','早餐','receptive','🥞']] },
  { file: 'elementary/g4/g4-u01/lesson-03.json', id: 'g4-u01-l03', unitId: 'g4-u01', grade: 4, title: '今天天氣 Weather', titleEn: 'Weather', theme: '天氣',
    vocab: [['sunny','晴天','productive','☀️'],['rainy','雨天','productive','🌧️'],['cloudy','陰天','productive','☁️'],['windy','颳風','receptive','💨'],['snowy','下雪','receptive','❄️'],['hot','熱','receptive','🥵']] },
  { file: 'elementary/g4/g4-u01/lesson-04.json', id: 'g4-u01-l04', unitId: 'g4-u01', grade: 4, title: '穿什麼 Clothes', titleEn: 'Clothes', theme: '衣物',
    vocab: [['shirt','襯衫','productive','👕'],['pants','褲子','productive','👖'],['hat','帽子','productive','🧢'],['shoes','鞋子','productive','👟'],['dress','洋裝','receptive','👗'],['socks','襪子','receptive','🧦']] },
  { file: 'elementary/g4/g4-u01/lesson-05.json', id: 'g4-u01-l05', unitId: 'g4-u01', grade: 4, title: '運動時間 Sports', titleEn: 'Sports', theme: '運動',
    vocab: [['soccer','足球','productive','⚽'],['basketball','籃球','productive','🏀'],['swim','游泳','productive','🏊'],['bike','騎腳踏車','productive','🚴'],['baseball','棒球','receptive','⚾'],['tennis','網球','receptive','🎾']] },
  // ===== 小四 U02 Around Town =====
  { file: 'elementary/g4/g4-u02/lesson-01.json', id: 'g4-u02-l01', unitId: 'g4-u02', grade: 4, title: '去哪裡 Places', titleEn: 'Places', theme: '地點',
    vocab: [['school','學校','productive','🏫'],['park','公園','productive','🏞️'],['store','商店','productive','🏪'],['home','家','productive','🏠'],['zoo','動物園','receptive','🦓'],['hospital','醫院','receptive','🏥']] },
  { file: 'elementary/g4/g4-u02/lesson-02.json', id: 'g4-u02-l02', unitId: 'g4-u02', grade: 4, title: '搭什麼車 Transportation', titleEn: 'Transportation', theme: '交通工具',
    vocab: [['bus','公車','productive','🚌'],['car','汽車','productive','🚗'],['bike','腳踏車','productive','🚲'],['train','火車','productive','🚆'],['plane','飛機','receptive','✈️'],['boat','船','receptive','⛵']] },
  { file: 'elementary/g4/g4-u02/lesson-03.json', id: 'g4-u02-l03', unitId: 'g4-u02', grade: 4, title: '我的興趣 Hobbies', titleEn: 'Hobbies', theme: '興趣嗜好',
    vocab: [['read','閱讀','productive','📖'],['draw','畫畫','productive','🎨'],['sing','唱歌','productive','🎤'],['dance','跳舞','productive','💃'],['swim','游泳','receptive','🏊'],['cook','煮飯','receptive','🍳']] },
  { file: 'elementary/g4/g4-u02/lesson-04.json', id: 'g4-u02-l04', unitId: 'g4-u02', grade: 4, title: '長大想做什麼 Jobs', titleEn: 'Jobs', theme: '職業',
    vocab: [['teacher','老師','productive','👩‍🏫'],['doctor','醫生','productive','👨‍⚕️'],['cook','廚師','productive','👨‍🍳'],['farmer','農夫','productive','👨‍🌾'],['police','警察','receptive','👮'],['nurse','護理師','receptive','👩‍⚕️']] },
  { file: 'elementary/g4/g4-u02/lesson-05.json', id: 'g4-u02-l05', unitId: 'g4-u02', grade: 4, title: '大自然 Nature', titleEn: 'Nature', theme: '大自然',
    vocab: [['sun','太陽','productive','☀️'],['moon','月亮','productive','🌙'],['star','星星','productive','⭐'],['tree','樹','productive','🌳'],['flower','花','productive','🌸'],['river','河','receptive','🏞️']] },
]

function parseLessonJson(text) {
  let t = String(text).trim()
  // 去除可能的 markdown 圍欄
  t = t.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
  const s = t.indexOf('{')
  const e = t.lastIndexOf('}')
  if (s >= 0 && e > s) t = t.slice(s, e + 1)
  return JSON.parse(t)
}

phase('Author')
const results = await parallel(LESSONS.map((L) => async () => {
  const vocabStr = L.vocab.map((v) => `${v[0]}（${v[1]}, ${v[2]}, ${v[3]}）`).join('、')
  const prompt = `${SPEC}

=== 這堂課的設定 ===
id: ${L.id}
unitId: ${L.unitId}
title: ${L.title}
titleEn: ${L.titleEn}
grade: ${L.grade}
主題: ${L.theme}
本課單字清單（word（中文, kind, emoji））：${vocabStr}

請依以上設定與規則，輸出這堂課完整的 JSON（只輸出 JSON 物件）。`
  const raw = await agent(prompt, { label: `lesson:${L.id}`, phase: 'Author' })
  try {
    const json = parseLessonJson(raw)
    return { file: L.file, id: L.id, ok: true, json }
  } catch (err) {
    return { file: L.file, id: L.id, ok: false, error: String(err), raw: String(raw).slice(0, 400) }
  }
}))

const out = { lessons: {}, errors: [] }
for (const r of results) {
  if (!r) continue
  if (r.ok) out.lessons[r.file] = r.json
  else out.errors.push({ file: r.file, id: r.id, error: r.error, raw: r.raw })
}
log(`完成 ${Object.keys(out.lessons).length} 課，失敗 ${out.errors.length} 課`)
return out
