#!/usr/bin/env python3
"""讀取 author-lessons 工作流程輸出 → 寫入課程檔 → 驗證 → 生成測驗 → 更新 manifest。
用法: python3 scripts/apply-authored-lessons.py <workflow-output-file>
"""
import json, os, sys, copy

ROOT = os.path.join(os.path.dirname(__file__), '..', 'public', 'content')
SKILLS = {'listening', 'speaking', 'reading', 'writing'}
PHASES = {'guided', 'independent', 'check'}

UNITS = [
    {'id': 'g3-u01', 'dir': 'elementary/g3/g3-u01', 'title': 'Hello, Friends! 哈囉，朋友！', 'grade': 3, 'cefr': 'A1', 'planetEmoji': '🍃'},
    {'id': 'g3-u02', 'dir': 'elementary/g3/g3-u02', 'title': 'My World 我的世界', 'grade': 3, 'cefr': 'A1', 'planetEmoji': '🌍'},
    {'id': 'g4-u01', 'dir': 'elementary/g4/g4-u01', 'title': 'My Day 我的一天', 'grade': 4, 'cefr': 'A1', 'planetEmoji': '🔥'},
    {'id': 'g4-u02', 'dir': 'elementary/g4/g4-u02', 'title': 'Around Town 城市生活', 'grade': 4, 'cefr': 'A1', 'planetEmoji': '🏙️'},
]


def validate_ex(ex, ctx, errs):
    eid = ex.get('id', '?')
    if ex.get('skill') not in SKILLS: errs.append(f"{ctx}({eid}): bad skill {ex.get('skill')}")
    if ex.get('phase') not in PHASES: errs.append(f"{ctx}({eid}): bad phase {ex.get('phase')}")
    t = ex.get('type')
    if t in ('mcq', 'listen-choose'):
        ids = [o.get('id') for o in ex.get('options', [])]
        if len(ids) < 2: errs.append(f"{ctx}({eid}): <2 options")
        if ex.get('answerId') not in ids: errs.append(f"{ctx}({eid}): answerId not in options")
        if t == 'listen-choose' and not ex.get('audioText'): errs.append(f"{ctx}({eid}): no audioText")
    elif t == 'matching':
        if len(ex.get('pairs', [])) < 2: errs.append(f"{ctx}({eid}): <2 pairs")
        for p in ex.get('pairs', []):
            if not p.get('id') or 'left' not in p or 'right' not in p: errs.append(f"{ctx}({eid}): bad pair")
    elif t == 'fill-in':
        if '___' not in ex.get('prompt', ''): errs.append(f"{ctx}({eid}): prompt no ___")
        if not ex.get('acceptableAnswers'): errs.append(f"{ctx}({eid}): no acceptableAnswers")
    elif t == 'ordering':
        if len(ex.get('tokens', [])) < 2: errs.append(f"{ctx}({eid}): <2 tokens")
    elif t == 'spelling':
        if not ex.get('word'): errs.append(f"{ctx}({eid}): no word")
        if ex.get('mode') not in ('type', 'tiles'): errs.append(f"{ctx}({eid}): bad mode")
    elif t == 'speak':
        if not ex.get('target'): errs.append(f"{ctx}({eid}): no target")
        if ex.get('mode') not in ('repeat-required', 'free-bonus'): errs.append(f"{ctx}({eid}): bad speak mode")
    elif t == 'reading':
        if not ex.get('questions'): errs.append(f"{ctx}({eid}): no questions")
    else:
        errs.append(f"{ctx}({eid}): unknown type {t}")


def validate_lesson(l, ctx, errs):
    for k in ('id', 'unitId', 'title', 'grade', 'cefr', 'ageTier'):
        if k not in l: errs.append(f"{ctx}: missing {k}")
    exs = l.get('exercises', [])
    if len(exs) < 8: errs.append(f"{ctx}: only {len(exs)} exercises (want >=8)")
    if not any(e.get('phase') == 'check' for e in exs): errs.append(f"{ctx}: no check items")
    if not any(e.get('type') == 'speak' for e in exs): errs.append(f"{ctx}: no speak item")
    for ex in exs: validate_ex(ex, ctx, errs)


def write_json(rel, obj):
    full = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)


def gen_quiz(unit, kind):
    """從該單元 5 課的 check 題抽樣組成測驗。"""
    pools = []
    for n in range(1, 6):
        rel = f"{unit['dir']}/lesson-0{n}.json"
        full = os.path.join(ROOT, rel)
        if not os.path.exists(full):
            continue
        l = json.load(open(full, encoding='utf-8'))
        pools.append([e for e in l.get('exercises', []) if e.get('phase') == 'check'])
    target = 8 if kind == 'review' else 10
    items, idx, guard = [], 0, 0
    while len(items) < target and any(pools) and guard < 500:
        p = pools[idx % len(pools)] if pools else []
        if p:
            ex = copy.deepcopy(p.pop(0))
            ex['id'] = f"{unit['id']}-{'rev' if kind == 'review' else 'pro'}-{len(items)+1}"
            items.append(ex)
        idx += 1; guard += 1
    quiz = {
        'schemaVersion': 1,
        'id': f"{unit['id']}-{'review' if kind == 'review' else 'promotion'}",
        'unitId': unit['id'],
        'kind': kind,
        'title': (f"{unit['title']} · 單元複習" if kind == 'review' else f"🛸 晉級測驗：{unit['title']}"),
        'passThreshold': 0.7 if kind == 'review' else 0.8,
        'items': items,
    }
    if kind == 'promotion':
        quiz['skillFloors'] = {'listening': 0.7, 'reading': 0.7, 'writing': 0.6}
    return quiz


def main():
    out_path = sys.argv[1]
    data = json.load(open(out_path, encoding='utf-8'))
    res = data.get('result', data)
    if isinstance(res, str):
        res = json.loads(res)
    lessons = res.get('lessons', {})
    werrors = res.get('errors', [])

    print(f"工作流程產出課程: {len(lessons)}，工作流程內失敗: {len(werrors)}")
    for e in werrors:
        print("  ⚠ 代理失敗:", e.get('id'), e.get('error'))

    errs = []
    # 1) 寫入 + 驗證每堂課
    for rel, obj in lessons.items():
        validate_lesson(obj, rel, errs)
        write_json(rel, obj)
    print(f"已寫入 {len(lessons)} 堂課")

    # 2) 生成各單元 review + promotion
    for u in UNITS:
        for kind, fname in (('review', 'review.json'), ('promotion', 'promotion.json')):
            q = gen_quiz(u, kind)
            if len(q['items']) < (6 if kind == 'review' else 8):
                errs.append(f"{u['id']} {kind}: 只取到 {len(q['items'])} 題")
            for ex in q['items']:
                validate_ex(ex, f"{u['id']}/{kind}", errs)
            write_json(f"{u['dir']}/{fname}", q)
    print("已生成 4 單元的複習＋晉級測驗")

    # 3) 更新 manifest
    manifest = {'schemaVersion': 1, 'units': []}
    for u in UNITS:
        manifest['units'].append({
            'id': u['id'], 'title': u['title'], 'grade': u['grade'], 'cefr': u['cefr'],
            'planetEmoji': u['planetEmoji'],
            'lessonFiles': [f"{u['dir']}/lesson-0{n}.json" for n in range(1, 6)],
            'reviewFile': f"{u['dir']}/review.json",
            'promotionFile': f"{u['dir']}/promotion.json",
        })
    write_json('manifest.json', manifest)
    print("已更新 manifest（4 單元）")

    print(f"\n驗證錯誤: {len(errs)}")
    for e in errs:
        print("  ✗", e)
    sys.exit(1 if errs else 0)


if __name__ == '__main__':
    main()
