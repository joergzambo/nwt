"""Unabhängige Gegenrechnung Zahlensysteme mit Pythons int()/format()."""
import json, sys
def to(n, b):
    if n == 0: return '0'
    D = '0123456789ABCDEF'; s = ''
    while n: s = D[n % b] + s; n //= b
    return s
def main(p):
    d = json.load(open(p)); bad = 0
    for t in d['tasks']:
        for it in t['items']:
            if int(it['q'], it['from']) != it['n'] or it['a'] != (format(it['n'], 'b') if it['to'] == 2 else format(it['n'], 'X') if it['to'] == 16 else format(it['n'], 'o') if it['to'] == 8 else str(it['n'])):
                bad += 1; print(t['code'], it)
        if len({(i['from'], i['to']) for i in t['items']}) != 4: bad += 1; print(t['code'], 'doppelt')
    for e in d['extra']:
        if e['s'] != to(e['n'], e['b']) or e['back'] != e['n'] or int(e['g4'], 2) != e['n'] or len(e['g4']) % 4: bad += 1; print(e)
        rem = [int(x) for x in e['dv'].split(',')]
        if sum(r * e['b'] ** (len(rem) - 1 - i) for i, r in enumerate(rem)) != e['n']: bad += 1; print('div', e)
    print(len(d['tasks']), 'Aufgaben +', len(d['extra']), 'Zahlen geprüft,', bad, 'Abweichungen')
    sys.exit(1 if bad else 0)
main(sys.argv[1])
