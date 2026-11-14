"""Unabhängige Gegenrechnung: Routenauswahl (kleinste AD, dann kleinste Metrik)."""
import json, sys
AD = {'connected':0,'static':1,'ebgp':20,'eigrp':90,'ospf':110,'isis':115,'rip':120}
def win(offers):
    return sorted(offers, key=lambda o: (AD[o['proto']], o['metric']))[0]['proto']
def main(p):
    data = json.load(open(p)); bad = 0
    for t in data:
        for n in t['nets']:
            w = win(n['offers'])
            if w != n['winProto']:
                bad += 1; print(t['code'], n['net'], w, 'vs', n['winProto'])
    print(len(data), 'Aufgaben geprüft,', bad, 'Abweichungen')
    sys.exit(1 if bad else 0)
main(sys.argv[1])
