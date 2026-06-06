export const meta = {
  name: 'author-long-input',
  description: '把 G3-G4 的 20 課 Input 閱讀短文加長（6-8 句 + 3 題理解）',
  phases: [{ title: 'Author', detail: '一個代理重寫一課的加長 input' }],
}

const SPEC = `
你要為「一堂兒童英文課」重寫加長版的「分級閱讀短文(Input)」。CEFR A1、中文母語、可解碼。
【只輸出合法 JSON 物件，無 markdown 圍欄、無多餘文字。】
格式：
{
  "input": {
    "passage": "6~8 句的英文短文（一段），只用『本課單字』＋最常見功能字（the,a,an,is,are,am,I,you,he,she,it,we,they,my,your,his,her,this,that,these,those,have,has,like,likes,can,and,or,but,to,in,on,at,with,see,look,go,goes,here,there,too,very,a lot,every day）。要用到多個本課單字，有簡單情節/連貫，i+1、約九成可懂。",
    "passageZh": "整段中文翻譯",
    "questions": [
      {"id":"q1","prompt":"理解問題","promptZh":"中文輔助","options":[{"id":"a","text":"..."},{"id":"b","text":"..."},{"id":"c","text":"..."}],"answerId":"a"},
      {"id":"q2","prompt":"理解問題","options":[{"id":"a","text":"..."},{"id":"b","text":"..."},{"id":"c","text":"..."}],"answerId":"b"},
      {"id":"q3","prompt":"理解問題","options":[{"id":"a","text":"..."},{"id":"b","text":"..."},{"id":"c","text":"..."}],"answerId":"c"}
    ]
  }
}
規則：passage 英文正確、簡單、用到本課單字、6~8 句；questions 恰 3 題、answerId 必須對應某 option id；只輸出 JSON。
`

const L = (file, id, theme, words) => ({ file, id, theme, words })
const LESSONS = [
  L('elementary/g3/g3-u01/lesson-01.json', 'g3-u01-l01', '打招呼與禮貌', 'hello, goodbye, thank you, sorry, please'),
  L('elementary/g3/g3-u01/lesson-02.json', 'g3-u01-l02', '名字與自我介紹', 'name, friend, nice, boy, girl, teacher'),
  L('elementary/g3/g3-u01/lesson-03.json', 'g3-u01-l03', '心情感受', 'happy, sad, fine, tired, angry, hungry'),
  L('elementary/g3/g3-u01/lesson-04.json', 'g3-u01-l04', '數字', 'one, two, three, four, five, ten'),
  L('elementary/g3/g3-u01/lesson-05.json', 'g3-u01-l05', '顏色', 'red, blue, yellow, green, purple, pink'),
  L('elementary/g3/g3-u02/lesson-01.json', 'g3-u02-l01', '家人', 'father, mother, brother, sister, baby, grandma'),
  L('elementary/g3/g3-u02/lesson-02.json', 'g3-u02-l02', '身體部位', 'hand, eye, ear, nose, mouth, foot'),
  L('elementary/g3/g3-u02/lesson-03.json', 'g3-u02-l03', '動物', 'dog, cat, bird, fish, rabbit, lion'),
  L('elementary/g3/g3-u02/lesson-04.json', 'g3-u02-l04', '食物水果', 'apple, banana, milk, bread, egg, water'),
  L('elementary/g3/g3-u02/lesson-05.json', 'g3-u02-l05', '教室物品', 'book, pen, pencil, bag, ruler, eraser'),
  L('elementary/g4/g4-u01/lesson-01.json', 'g4-u01-l01', '每日動作', 'eat, sleep, play, study, run, jump'),
  L('elementary/g4/g4-u01/lesson-02.json', 'g4-u01-l02', '作息與時間', 'morning, noon, night, school, home, breakfast'),
  L('elementary/g4/g4-u01/lesson-03.json', 'g4-u01-l03', '天氣', 'sunny, rainy, cloudy, windy, snowy, hot'),
  L('elementary/g4/g4-u01/lesson-04.json', 'g4-u01-l04', '衣物', 'shirt, pants, hat, shoes, dress, socks'),
  L('elementary/g4/g4-u01/lesson-05.json', 'g4-u01-l05', '運動', 'soccer, basketball, swim, bike, baseball, tennis'),
  L('elementary/g4/g4-u02/lesson-01.json', 'g4-u02-l01', '地點', 'school, park, store, home, zoo, hospital'),
  L('elementary/g4/g4-u02/lesson-02.json', 'g4-u02-l02', '交通工具', 'bus, car, bike, train, plane, boat'),
  L('elementary/g4/g4-u02/lesson-03.json', 'g4-u02-l03', '興趣嗜好', 'read, draw, sing, dance, swim, cook'),
  L('elementary/g4/g4-u02/lesson-04.json', 'g4-u02-l04', '職業', 'teacher, doctor, cook, farmer, police, nurse'),
  L('elementary/g4/g4-u02/lesson-05.json', 'g4-u02-l05', '大自然', 'sun, moon, star, tree, flower, river'),
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
主題: ${ls.theme}
本課單字: ${ls.words}

請輸出加長版 input（只輸出 JSON）。`
  const raw = await agent(prompt, { label: `in:${ls.id}`, phase: 'Author' })
  try { return { file: ls.file, ok: true, input: parseJson(raw).input } }
  catch (err) { return { file: ls.file, ok: false, error: String(err) } }
}))

const out = { inputs: {}, errors: [] }
for (const r of results) { if (!r) continue; if (r.ok) out.inputs[r.file] = r.input; else out.errors.push(r) }
log(`完成 ${Object.keys(out.inputs).length}，失敗 ${out.errors.length}`)
return out
