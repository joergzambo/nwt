"""Gegenrechnung Port Security: Szenario-Ausgang unabhängig nachrechnen."""
import json, sys

def expect(t):
    if t['kind'] == 'mode':
        return t['mode'] if t['mode'] in ('protect', 'restrict', 'shutdown') else None
    # kind == 'what': ok wenn macs <= max, sonst der Violation-Modus
    return 'ok' if t['macs'] <= t['max'] else t['mode']

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
