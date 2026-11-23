"""Unabhängige Gegenrechnung OSPF-Referenzbandbreite: Referenz = schnellste Leitung, Kosten = ref/bw."""
import json, sys
def main(fn):
    d = json.load(open(fn)); bad = 0
    for t in d:
        bws = t['ifs']
        ref = max(bws)                      # schnellste Leitung in Mbit/s
        costs = {}
        for bw in sorted(set(bws), reverse=True):
            costs[bw] = max(1, round(ref / bw))
        err = []
        if t['ref'] != ref: err.append(('ref', ref, t['ref']))
        got = {c['bw']: c['cost'] for c in t['costs']}
        if got != costs: err.append(('costs', costs, got))
        if len(set(bws)) < 2: err.append('nur eine Bandbreite')
        if err: bad += 1; print(t['code'], err)
    print(len(d), 'Aufgaben geprüft,', bad, 'Abweichungen')
    sys.exit(1 if bad else 0)
main(sys.argv[1])
