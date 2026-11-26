"""Gegenrechnung Verkabelung: Kabeltyp und Medienwahl unabhängig nachrechnen."""
import json, sys

GROUP = {'PC': 'A', 'Server': 'A', 'Router': 'A', 'Switch': 'B', 'Hub': 'B'}

def cable_type(d1, d2):
    return 'crossover' if GROUP[d1] == GROUP[d2] else 'straight'

def expect(t):
    if t['kind'] == 'media':
        return 'glasfaser' if (t['dist'] > 100 or t['envFiber']) else 'kupfer'
    if t['console']:
        return 'rollover'
    # d2 kann "(Konsolenport)" tragen -> nur bei console; sonst reiner Gerätename
    return cable_type(t['d1'], t['d2'])

def main(fn):
    d = json.load(open(fn)); bad = 0
    for t in d:
        exp = expect(t)
        if exp != t['ans']:
            bad += 1
            if bad <= 20: print(t['code'], t['kind'], 'erwartet', exp, 'bekam', t['ans'])
    print(len(d), 'Aufgaben geprüft,', bad, 'Abweichungen')
    sys.exit(1 if bad else 0)

main(sys.argv[1])
