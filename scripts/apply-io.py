#!/usr/bin/env python3
"""把 author-input-production 工作流程的 input/production 合併進既有課程，
並套用 S2 自然發音序列（digraphs/長母音...）。
用法: python3 scripts/apply-io.py <workflow-output-file>
"""
import json, os, sys

ROOT = os.path.join(os.path.dirname(__file__), '..', 'public', 'content')

# S2 自然發音 scope & sequence（CVC複習 → blends → digraphs → 長母音 → vowel team → r-controlled）
PHONICS = {
    'elementary/g3/g3-u01/lesson-01.json': ('short a', 'a', '/æ/', ['cat', 'hat', 'map']),
    'elementary/g3/g3-u01/lesson-02.json': ('short e', 'e', '/e/', ['pen', 'ten', 'bed']),
    'elementary/g3/g3-u01/lesson-03.json': ('short i', 'i', '/ɪ/', ['pig', 'sit', 'win']),
    'elementary/g3/g3-u01/lesson-04.json': ('short o', 'o', '/ɒ/', ['dog', 'top', 'box']),
    'elementary/g3/g3-u01/lesson-05.json': ('blend st', 'st', '/st/', ['stop', 'star', 'stand']),
    'elementary/g3/g3-u02/lesson-01.json': ('blend bl', 'bl', '/bl/', ['blue', 'black', 'blow']),
    'elementary/g3/g3-u02/lesson-02.json': ('blend br', 'br', '/br/', ['brown', 'bread', 'bring']),
    'elementary/g3/g3-u02/lesson-03.json': ('digraph sh', 'sh', '/ʃ/', ['ship', 'fish', 'shop']),
    'elementary/g3/g3-u02/lesson-04.json': ('digraph ch', 'ch', '/tʃ/', ['chair', 'cheese', 'lunch']),
    'elementary/g3/g3-u02/lesson-05.json': ('digraph th', 'th', '/θ/', ['thin', 'bath', 'math']),
    'elementary/g4/g4-u01/lesson-01.json': ('digraph wh', 'wh', '/w/', ['what', 'when', 'white']),
    'elementary/g4/g4-u01/lesson-02.json': ('long a (a_e)', 'a_e', '/eɪ/', ['cake', 'name', 'game']),
    'elementary/g4/g4-u01/lesson-03.json': ('long i (i_e)', 'i_e', '/aɪ/', ['bike', 'kite', 'nine']),
    'elementary/g4/g4-u01/lesson-04.json': ('long o (o_e)', 'o_e', '/oʊ/', ['home', 'nose', 'rose']),
    'elementary/g4/g4-u01/lesson-05.json': ('long u (u_e)', 'u_e', '/juː/', ['cute', 'cube', 'tube']),
    'elementary/g4/g4-u02/lesson-01.json': ('long e (ee)', 'ee', '/iː/', ['tree', 'see', 'green']),
    'elementary/g4/g4-u02/lesson-02.json': ('long e (ea)', 'ea', '/iː/', ['eat', 'read', 'sea']),
    'elementary/g4/g4-u02/lesson-03.json': ('vowel team ai/ay', 'ai', '/eɪ/', ['rain', 'train', 'play']),
    'elementary/g4/g4-u02/lesson-04.json': ('r-controlled ar', 'ar', '/ɑːr/', ['car', 'star', 'park']),
    'elementary/g4/g4-u02/lesson-05.json': ('r-controlled or', 'or', '/ɔːr/', ['fork', 'corn', 'storm']),
}


def apply_phonics(lesson, rel):
    if rel not in PHONICS:
        return
    label, grapheme, sound, examples = PHONICS[rel]
    lesson['phonicsFocus'] = f'{label} {sound}'
    card = {'kind': 'phonics', 'focus': f'{label} {sound}', 'grapheme': grapheme, 'sound': sound, 'examples': examples}
    teaching = lesson.get('teaching', [])
    for i, c in enumerate(teaching):
        if c.get('kind') == 'phonics':
            teaching[i] = card
            break
    else:
        teaching.append(card)
    lesson['teaching'] = teaching


def validate_io(aug, rel, errs):
    inp = aug.get('input') or {}
    if not inp.get('passage'):
        errs.append(f'{rel}: input 缺 passage')
    for q in inp.get('questions', []):
        ids = [o.get('id') for o in q.get('options', [])]
        if q.get('answerId') not in ids:
            errs.append(f"{rel}: input 題 {q.get('id')} answerId 不在 options")
    prod = aug.get('production') or {}
    if prod.get('mode') not in ('speak', 'write'):
        errs.append(f'{rel}: production.mode 不合法 {prod.get("mode")}')
    if not prod.get('prompt'):
        errs.append(f'{rel}: production 缺 prompt')


def main():
    data = json.load(open(sys.argv[1], encoding='utf-8'))
    res = data.get('result', data)
    if isinstance(res, str):
        res = json.loads(res)
    augments = res.get('augments', {})
    werrors = res.get('errors', [])
    print(f'工作流程產出: {len(augments)}，失敗: {len(werrors)}')
    for e in werrors:
        print('  ⚠ 代理失敗:', e.get('id'), e.get('error'))

    errs = []
    for rel, aug in augments.items():
        validate_io(aug, rel, errs)
        full = os.path.join(ROOT, rel)
        lesson = json.load(open(full, encoding='utf-8'))
        lesson['input'] = aug.get('input')
        lesson['production'] = aug.get('production')
        apply_phonics(lesson, rel)
        with open(full, 'w', encoding='utf-8') as f:
            json.dump(lesson, f, ensure_ascii=False, indent=2)
    print(f'已合併 {len(augments)} 課（input + production + 發音序列）')

    # 套用發音序列到沒有被 augment 但有設定的課（保險）
    for rel in PHONICS:
        if rel in augments:
            continue
        full = os.path.join(ROOT, rel)
        if os.path.exists(full):
            lesson = json.load(open(full, encoding='utf-8'))
            apply_phonics(lesson, rel)
            with open(full, 'w', encoding='utf-8') as f:
                json.dump(lesson, f, ensure_ascii=False, indent=2)

    print(f'\n驗證錯誤: {len(errs)}')
    for e in errs:
        print('  ✗', e)
    sys.exit(1 if errs else 0)


if __name__ == '__main__':
    main()
