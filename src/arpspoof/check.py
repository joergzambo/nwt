"""Unabhängige Gegenrechnung ARP-Spoofing."""
import json, sys
def ev(t):
    blocked = t['poisoning'] and t['defense'] in ('dai', 'static')
    gw = t['attMac'] if (t['poisoning'] and not blocked) else t['gwMac']
    mitm = t['poisoning'] and not blocked
    return gw, mitm, blocked
def main(p):
    data = json.load(open(p)); bad = 0
    for t in data:
        g, m, b = ev(t); r = t['res']
        if g != r['gwMacAtVictim'] or m != r['mitm'] or b != r['blocked']:
            bad += 1; print(t['code'], (g, m, b), 'vs', (r['gwMacAtVictim'], r['mitm'], r['blocked']))
    print(len(data), 'Aufgaben geprüft,', bad, 'Abweichungen')
    sys.exit(1 if bad else 0)
main(sys.argv[1])
