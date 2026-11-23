"""Gegenrechnung Troubleshooting: Fix passt zur Ursache, Status passt zum Fehler."""
import json, sys
MAP = {'admin': 'noshut', 'cable': 'cable', 'duplex': 'duplex', 'vlan': 'vlan', 'ip': 'ip'}
EXP = {'admin': ('administratively down', 'down'), 'cable': ('down', 'down'), 'duplex': ('up', 'up'), 'ip': ('up', 'up'), 'vlan': ('up', 'up')}
def main(fn):
    d = json.load(open(fn)); bad = 0
    for t in d:
        err = []
        if MAP[t['fault']] != t['fixId']: err.append('fix')
        if EXP[t['fault']] != (t['status'], t['proto']): err.append(('status', EXP[t['fault']], (t['status'], t['proto'])))
        if err: bad += 1; print(t['code'], err)
    print(len(d), 'Aufgaben geprüft,', bad, 'Abweichungen'); sys.exit(1 if bad else 0)
main(sys.argv[1])
