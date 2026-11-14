"""Unabhängige Gegenrechnung Rogue-DHCP: eigene Nachbildung des Wettlauf/Abwehr-Modells."""
import json, sys
def ev(t):
    drop = t['rogue'] and t['defense'] != 'none'
    offers = 1 + (1 if (t['rogue'] and not drop) else 0)
    winner = 'real' if not t['rogue'] else ('real' if drop else ('rogue' if t['race'] == 'rogue' else 'real'))
    gw = t['rogueGw'] if winner == 'rogue' else t['realGw']
    mitm = winner == 'rogue'
    return offers, gw, mitm
def main(p):
    data = json.load(open(p)); bad = 0
    for t in data:
        o, g, m = ev(t); r = t['res']
        if o != r['offersAtClient'] or g != r['gateway'] or m != r['mitm']:
            bad += 1; print(t['code'], (o, g, m), 'vs', (r['offersAtClient'], r['gateway'], r['mitm']))
        if r['offersAtClient'] not in (1, 2): bad += 1; print(t['code'], 'offers?', r['offersAtClient'])
    print(len(data), 'Aufgaben geprüft,', bad, 'Abweichungen')
    sys.exit(1 if bad else 0)
main(sys.argv[1])
