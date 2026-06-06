#!/usr/bin/env python3
"""套用：① 加長版 Input 短文（取代既有 lesson.input）② 閱讀樂園讀本 + readers.json
用法: python3 scripts/apply-reading.py <long-input-output> <readers-output>
"""
import json, os, sys

ROOT = os.path.join(os.path.dirname(__file__), '..', 'public', 'content')


def load_result(path):
    data = json.load(open(path, encoding='utf-8'))
    res = data.get('result', data)
    if isinstance(res, str):
        res = json.loads(res)
    return res


def write_json(rel, obj):
    full = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)


def validate_questions(qs, ctx, errs):
    for q in qs or []:
        ids = [o.get('id') for o in q.get('options', [])]
        if q.get('answerId') not in ids:
            errs.append(f"{ctx}: 題 {q.get('id')} answerId 不在 options")


def main():
    errs = []

    # ① 加長 Input
    inp_res = load_result(sys.argv[1])
    inputs = inp_res.get('inputs', {})
    for rel, inp in inputs.items():
        if not inp or not inp.get('passage'):
            errs.append(f"{rel}: input 缺 passage")
        validate_questions(inp.get('questions'), f"{rel} input", errs)
        full = os.path.join(ROOT, rel)
        lesson = json.load(open(full, encoding='utf-8'))
        lesson['input'] = inp
        write_json(rel, lesson)
    print(f"已套用加長 Input：{len(inputs)} 課")

    # ② 讀本
    rd_res = load_result(sys.argv[2])
    readers = rd_res.get('readers', [])
    refs = []
    for r in readers:
        rid = r['id']
        if not r.get('pages'):
            errs.append(f"reader {rid}: 缺 pages")
        validate_questions(r.get('questions'), f"reader {rid}", errs)
        r.setdefault('schemaVersion', 1)
        rel = f"readers/{rid}.json"
        write_json(rel, r)
        refs.append({
            'id': rid, 'unitId': r['unitId'], 'stage': r.get('stage', 'S2'),
            'level': r.get('level', 'L1'), 'title': r['title'], 'titleZh': r['titleZh'],
            'cover': r.get('cover', '📖'), 'file': rel,
        })
    write_json('readers.json', {'schemaVersion': 1, 'readers': refs})
    print(f"已寫入讀本：{len(readers)} 本 + readers.json")

    print(f"\n驗證錯誤：{len(errs)}")
    for e in errs:
        print('  ✗', e)
    sys.exit(1 if errs else 0)


if __name__ == '__main__':
    main()
