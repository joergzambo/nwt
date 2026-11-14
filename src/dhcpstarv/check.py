"""Unabhängige Gegenrechnung DHCP-Starvation: eigene Nachbildung des Abwehr-Modells.

node export.js > aufgaben.json && python3 check.py aufgaben.json
"""
import json, sys

def sim(t):
    pool = t['poolEnd'] - t['poolStart'] + 1
    free0 = pool - t['legit']
    eff = None
    if t['portSec'] > 0 and t['mode'] == 'both':
        got = min(t['flood'], t['portSec'], free0)
        if t['flood'] > t['portSec']: eff = 'portsec'
    elif t['verify'] and t['mode'] == 'both':
        got = min(t['flood'], free0)
    elif t['verify'] and t['mode'] == 'chaddr':
        got = 0; eff = 'verify'
    elif t['portSec'] > 0 and t['mode'] == 'chaddr':
        got = min(t['flood'], free0)
    else:
        got = min(t['flood'], free0)
    free = pool - t['legit'] - got
    return got, free <= 0, eff

def main(p):
    data = json.load(open(p)); bad = 0
    for t in data:
        got, exh, eff = sim(t)
        r = t['res']
        if got != r['attackerGot'] or exh != r['exhausted'] or (eff or None) != (r['effective'] or None):
            bad += 1; print(t['code'], (got, exh, eff), 'vs', (r['attackerGot'], r['exhausted'], r['effective']))
        if got < 0 or got > t['flood']: bad += 1; print(t['code'], 'got ausserhalb', got)
    print(len(data), 'Aufgaben geprüft,', bad, 'Abweichungen')
    sys.exit(1 if bad else 0)
main(sys.argv[1])
