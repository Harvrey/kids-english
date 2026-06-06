export const meta = {
  name: 'author-readers',
  description: '生成「閱讀樂園」12 本分級小讀本（S2, A1, 可解碼，每單元 3 本）',
  phases: [{ title: 'Author', detail: '一個代理寫一本小讀本' }],
}

const SPEC = `
你要寫一本給兒童的「超短分級英文小讀本」。CEFR A1、中文母語、可解碼、有簡單情節。
【只輸出合法 JSON 物件，無 markdown 圍欄、無多餘文字。】
格式：
{
  "pages": [ {"text":"一頁一句很短的英文", "zh":"中文"}, ... 共 5~8 頁 ],
  "questions": [
    {"id":"q1","prompt":"理解問題","promptZh":"中文","options":[{"id":"a","text":"..."},{"id":"b","text":"..."},{"id":"c","text":"..."}],"answerId":"a"},
    {"id":"q2","prompt":"理解問題","options":[{"id":"a","text":"..."},{"id":"b","text":"..."},{"id":"c","text":"..."}],"answerId":"b"},
    {"id":"q3","prompt":"理解問題","options":[{"id":"a","text":"..."},{"id":"b","text":"..."},{"id":"c","text":"..."}],"answerId":"a"}
  ]
}
規則：
- 每頁一句、簡短；用「允許單字 + 最常見功能字（the,a,an,is,are,am,I,you,he,she,it,we,they,my,your,this,that,have,has,like,likes,can,and,or,to,in,on,at,with,see,look,go,here,there,too,very,a lot,one,two,three）」。
- 故事要有簡單的開始-過程-結尾感。
- L1 讀本更短更簡單（約 5 頁、每句 3~5 字）；L2 可到 7~8 頁、句子稍長。
- questions 恰 3 題、answerId 必須對應某 option id。
- 只輸出 JSON 物件本身。
`

const R = (id, unitId, level, title, titleZh, cover, theme, words) => ({ id, unitId, level, title, titleZh, cover, theme, words })
const READERS = [
  R('g3-u01-r01', 'g3-u01', 'L1', 'Hello, Friend!', '哈囉，朋友！', '👋', '兩個小孩打招呼、自我介紹、交朋友', 'hello, hi, goodbye, name, friend, boy, girl, nice'),
  R('g3-u01-r02', 'g3-u01', 'L1', 'How Do You Feel?', '你的心情', '😊', '小孩今天的各種心情', 'happy, sad, fine, tired, angry, hungry'),
  R('g3-u01-r03', 'g3-u01', 'L2', 'Count and Colors', '數字與顏色', '🌈', '數出不同顏色的東西', 'one, two, three, four, five, red, blue, yellow, green, apple, fish'),
  R('g3-u02-r01', 'g3-u02', 'L1', 'My Family', '我的家人', '👨‍👩‍👧‍👦', '介紹家裡每個人', 'father, mother, brother, sister, baby, grandma, family, love'),
  R('g3-u02-r02', 'g3-u02', 'L1', 'My Pet', '我的寵物', '🐶', '小孩和他的寵物', 'dog, cat, bird, fish, rabbit, eye, nose, foot, big, small'),
  R('g3-u02-r03', 'g3-u02', 'L2', 'Yummy Lunch', '好吃的午餐', '🍎', '小孩吃午餐', 'apple, banana, milk, bread, egg, water, eat, yummy'),
  R('g4-u01-r01', 'g4-u01', 'L2', 'My Day', '我的一天', '🌅', '小孩從早到晚做的事', 'morning, noon, night, eat, sleep, play, study, school, home'),
  R('g4-u01-r02', 'g4-u01', 'L2', 'What is the Weather?', '今天天氣', '☀️', '不同天氣穿不同衣服', 'sunny, rainy, cloudy, windy, hot, cold, hat, shoes, coat'),
  R('g4-u01-r03', 'g4-u01', 'L2', 'Let us Play!', '一起玩！', '⚽', '小孩玩各種運動', 'soccer, basketball, swim, bike, baseball, tennis, play, run, jump'),
  R('g4-u02-r01', 'g4-u02', 'L2', 'Around Town', '城市走走', '🚌', '坐車去不同地方', 'bus, car, bike, train, school, park, store, zoo, go'),
  R('g4-u02-r02', 'g4-u02', 'L2', 'I Can Do It', '我做得到', '🎨', '小孩的興趣和長大想做的工作', 'read, draw, sing, dance, cook, teacher, doctor, farmer'),
  R('g4-u02-r03', 'g4-u02', 'L2', 'In Nature', '在大自然', '🌳', '到戶外看大自然', 'sun, moon, star, tree, flower, river, bird, see, look'),
]

function parseJson(text) {
  let t = String(text).trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
  const s = t.indexOf('{'); const e = t.lastIndexOf('}')
  if (s >= 0 && e > s) t = t.slice(s, e + 1)
  return JSON.parse(t)
}

phase('Author')
const results = await parallel(READERS.map((r) => async () => {
  const prompt = `${SPEC}

=== 這本讀本 ===
title: ${r.title}
等級: ${r.level}
主題故事: ${r.theme}
允許單字: ${r.words}

請輸出這本讀本的 pages 與 questions（只輸出 JSON）。`
  const raw = await agent(prompt, { label: `reader:${r.id}`, phase: 'Author' })
  try {
    const body = parseJson(raw)
    return { ok: true, reader: { id: r.id, unitId: r.unitId, stage: 'S2', level: r.level, title: r.title, titleZh: r.titleZh, cover: r.cover, pages: body.pages, questions: body.questions } }
  } catch (err) {
    return { ok: false, id: r.id, error: String(err) }
  }
}))

const out = { readers: [], errors: [] }
for (const r of results) { if (!r) continue; if (r.ok) out.readers.push(r.reader); else out.errors.push(r) }
log(`完成 ${out.readers.length} 本，失敗 ${out.errors.length}`)
return out
