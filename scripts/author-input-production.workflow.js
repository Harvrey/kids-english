export const meta = {
  name: 'author-input-production',
  description: '為 G3-G4 的 20 課各產出「分級閱讀短文(Input)」與「開放產出任務(Production)」（規格六段式）',
  phases: [{ title: 'Author', detail: '一個代理寫一課的 input+production' }],
}

const SPEC = `
你要為「一堂兒童英文課」產出兩段內容：分級閱讀短文(Input) 與 開放產出任務(Production)。對象 CEFR A1、中文母語學習者。
【只輸出合法 JSON 物件，不要 markdown 圍欄、不要多餘文字。】

格式：
{
  "input": {
    "passage": "3~5 句很簡單的英文短文，只用『本課單字』＋最常見功能字（the,a,an,is,are,am,I,you,he,she,it,we,they,my,your,this,that,these,have,has,like,likes,can,and,or,to,in,on,at,see,look,go,goes,here,there,too,very,a lot）。要用到多個本課單字，i+1、約九成可懂。",
    "passageZh": "整段中文翻譯",
    "questions": [
      {"id":"q1","prompt":"一個理解問題（可中英）","promptZh":"中文輔助（可省略）","options":[{"id":"a","text":"..."},{"id":"b","text":"..."},{"id":"c","text":"..."}],"answerId":"a"},
      {"id":"q2","prompt":"第二個理解問題","options":[{"id":"a","text":"..."},{"id":"b","text":"..."},{"id":"c","text":"..."}],"answerId":"b"}
    ]
  },
  "production": {
    "mode": "speak",
    "prompt": "一句英文任務指示（用目標語言，例如 Tell me about your family.）",
    "promptZh": "中文說明這個任務要做什麼",
    "example": "一句示範答案（用本課單字、A1 簡單句）",
    "canDo": "對應的 can-do（中文，例如：能用簡單句介紹自己的家人）"
  }
}

規則：
- passage 與 example 的英文必須正確、簡單、且用到「本課單字」。
- questions 恰 2 題，每題 answerId 必須對應某個 option 的 id。
- production.mode 多數用 "speak"（本階段重聽說）；若主題適合簡單書寫可用 "write"。
- 只輸出上面這個 JSON 物件本身。
`

const L = (file, id, grade, theme, words) => ({ file, id, grade, theme, words })
const LESSONS = [
  L('elementary/g3/g3-u01/lesson-01.json', 'g3-u01-l01', 3, '打招呼與禮貌', 'hello(你好), goodbye(再見), thank you(謝謝), sorry(對不起), please(請)'),
  L('elementary/g3/g3-u01/lesson-02.json', 'g3-u01-l02', 3, '名字與自我介紹', 'name(名字), friend(朋友), nice(友善的), boy(男孩), girl(女孩), teacher(老師)'),
  L('elementary/g3/g3-u01/lesson-03.json', 'g3-u01-l03', 3, '心情感受', 'happy(開心), sad(難過), fine(很好), tired(累), angry(生氣), hungry(餓)'),
  L('elementary/g3/g3-u01/lesson-04.json', 'g3-u01-l04', 3, '數字 1-10', 'one(一), two(二), three(三), four(四), five(五), ten(十)'),
  L('elementary/g3/g3-u01/lesson-05.json', 'g3-u01-l05', 3, '顏色', 'red(紅), blue(藍), yellow(黃), green(綠), purple(紫), pink(粉紅)'),
  L('elementary/g3/g3-u02/lesson-01.json', 'g3-u02-l01', 3, '家人', 'father(爸爸), mother(媽媽), brother(兄弟), sister(姊妹), baby(寶寶), grandma(奶奶)'),
  L('elementary/g3/g3-u02/lesson-02.json', 'g3-u02-l02', 3, '身體部位', 'hand(手), eye(眼睛), ear(耳朵), nose(鼻子), mouth(嘴巴), foot(腳)'),
  L('elementary/g3/g3-u02/lesson-03.json', 'g3-u02-l03', 3, '動物', 'dog(狗), cat(貓), bird(鳥), fish(魚), rabbit(兔), lion(獅子)'),
  L('elementary/g3/g3-u02/lesson-04.json', 'g3-u02-l04', 3, '食物水果', 'apple(蘋果), banana(香蕉), milk(牛奶), bread(麵包), egg(蛋), water(水)'),
  L('elementary/g3/g3-u02/lesson-05.json', 'g3-u02-l05', 3, '教室物品', 'book(書), pen(筆), pencil(鉛筆), bag(書包), ruler(尺), eraser(橡皮擦)'),
  L('elementary/g4/g4-u01/lesson-01.json', 'g4-u01-l01', 4, '每日動作', 'eat(吃), sleep(睡), play(玩), study(讀書), run(跑), jump(跳)'),
  L('elementary/g4/g4-u01/lesson-02.json', 'g4-u01-l02', 4, '作息與時間', 'morning(早上), noon(中午), night(晚上), school(學校), home(家), breakfast(早餐)'),
  L('elementary/g4/g4-u01/lesson-03.json', 'g4-u01-l03', 4, '天氣', 'sunny(晴), rainy(雨), cloudy(陰), windy(風), snowy(雪), hot(熱)'),
  L('elementary/g4/g4-u01/lesson-04.json', 'g4-u01-l04', 4, '衣物', 'shirt(襯衫), pants(褲子), hat(帽子), shoes(鞋), dress(洋裝), socks(襪子)'),
  L('elementary/g4/g4-u01/lesson-05.json', 'g4-u01-l05', 4, '運動', 'soccer(足球), basketball(籃球), swim(游泳), bike(騎車), baseball(棒球), tennis(網球)'),
  L('elementary/g4/g4-u02/lesson-01.json', 'g4-u02-l01', 4, '地點', 'school(學校), park(公園), store(商店), home(家), zoo(動物園), hospital(醫院)'),
  L('elementary/g4/g4-u02/lesson-02.json', 'g4-u02-l02', 4, '交通工具', 'bus(公車), car(汽車), bike(腳踏車), train(火車), plane(飛機), boat(船)'),
  L('elementary/g4/g4-u02/lesson-03.json', 'g4-u02-l03', 4, '興趣嗜好', 'read(閱讀), draw(畫畫), sing(唱歌), dance(跳舞), swim(游泳), cook(煮飯)'),
  L('elementary/g4/g4-u02/lesson-04.json', 'g4-u02-l04', 4, '職業', 'teacher(老師), doctor(醫生), cook(廚師), farmer(農夫), police(警察), nurse(護理師)'),
  L('elementary/g4/g4-u02/lesson-05.json', 'g4-u02-l05', 4, '大自然', 'sun(太陽), moon(月亮), star(星星), tree(樹), flower(花), river(河)'),
]

function parseJson(text) {
  let t = String(text).trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
  const s = t.indexOf('{'); const e = t.lastIndexOf('}')
  if (s >= 0 && e > s) t = t.slice(s, e + 1)
  return JSON.parse(t)
}

phase('Author')
const results = await parallel(LESSONS.map((ls) => async () => {
  const prompt = `${SPEC}

=== 這堂課 ===
id: ${ls.id}
年級: G${ls.grade}（階段 S2, A1）
主題: ${ls.theme}
本課單字: ${ls.words}

請依規則輸出這堂課的 input 與 production（只輸出 JSON 物件）。`
  const raw = await agent(prompt, { label: `io:${ls.id}`, phase: 'Author' })
  try {
    const json = parseJson(raw)
    return { file: ls.file, id: ls.id, ok: true, input: json.input, production: json.production }
  } catch (err) {
    return { file: ls.file, id: ls.id, ok: false, error: String(err), raw: String(raw).slice(0, 300) }
  }
}))

const out = { augments: {}, errors: [] }
for (const r of results) {
  if (!r) continue
  if (r.ok) out.augments[r.file] = { input: r.input, production: r.production }
  else out.errors.push({ file: r.file, id: r.id, error: r.error, raw: r.raw })
}
log(`完成 ${Object.keys(out.augments).length} 課，失敗 ${out.errors.length}`)
return out
