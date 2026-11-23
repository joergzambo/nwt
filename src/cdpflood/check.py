"""Gegenrechnung CDP-Flooding: anfällig, wenn CDP global UND am Port aktiv ist."""
import json, sys
def main(fn):
    d = json.load(open(fn)); bad = 0
    for t in d:
        vuln = (not t['g']) and (not t['p'])
        defense = 'portoff' if vuln else 'none'
        err = []
        if vuln != t['vulnerable']: err.append('vuln')
        if defense != t['defense']: err.append(('def', defense, t['defense']))
        if err: bad += 1; print(t['code'], err)
    print(len(d), 'Aufgaben geprüft,', bad, 'Abweichungen'); sys.exit(1 if bad else 0)
main(sys.argv[1])
