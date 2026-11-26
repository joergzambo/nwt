"""Gegenrechnung EIGRP: Metrik, Feasibility, Successor unabhängig nachrechnen."""
import json, sys

def metric(min_bw, delay_us):
    return 256 * ((10000000 // min_bw) + (delay_us // 10))

def expect(t):
    k = t['kind']
    if k == 'metric':
        return metric(t['minBW'], t['delay'])
    if k == 'feasible':
        return 'ja' if t['rd'] < t['fd'] else 'nein'
    if k == 'successor':
        succ = min(t['paths'], key=lambda p: p['fd'])
        return succ['id']
    return None

def main(fn):
    d = json.load(open(fn)); bad = 0
    for t in d:
        exp = expect(t)
        if exp != t['ans']:
            bad += 1
            if bad <= 20: print(t['code'], t['kind'], 'erwartet', exp, 'bekam', t['ans'])
        # Feasible-Successor-Liste gegenrechnen
        if t['kind'] == 'successor':
            succ = min(t['paths'], key=lambda p: p['fd'])
            fs = sorted(p['id'] for p in t['paths'] if p['id'] != succ['id'] and p['rd'] < succ['fd'])
            if fs != sorted(t['fs']):
                bad += 1
                if bad <= 20: print(t['code'], 'FS erwartet', fs, 'bekam', t['fs'])
    print(len(d), 'Aufgaben geprüft,', bad, 'Abweichungen')
    sys.exit(1 if bad else 0)

main(sys.argv[1])
