"""Gegenrechnung STP-Angriff: Angreifer wird Root bei attPrio<=legitRoot; Schutz nach Porttyp."""
import json, sys
def main(fn):
    d = json.load(open(fn)); bad = 0
    for t in d:
        wins = t['attPrio'] <= t['legitRoot']
        defense = ('bpduguard' if t['port'] == 'access' else 'rootguard') if wins else 'none'
        err = []
        if wins != t['wins']: err.append('wins')
        if defense != t['defense']: err.append(('defense', defense, t['defense']))
        if err: bad += 1; print(t['code'], err)
    print(len(d), 'Aufgaben geprüft,', bad, 'Abweichungen'); sys.exit(1 if bad else 0)
main(sys.argv[1])
