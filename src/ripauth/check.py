"""Gegenrechnung RIP-Auth: Ergebnis aus Modus + Schlüsselgleichheit neu ableiten."""
import json, sys
def main(fn):
    d = json.load(open(fn)); bad = 0
    for t in d:
        mode, match = t['mode'], t['match']
        if mode == 'none': o = 'inject'
        elif not match: o = 'nomatch'
        elif mode == 'text': o = 'cleartext'
        else: o = 'secure'
        if o != t['out']: bad += 1; print(t['code'], 'erwartet', o, 'hat', t['out'])
    print(len(d), 'Aufgaben geprüft,', bad, 'Abweichungen'); sys.exit(1 if bad else 0)
main(sys.argv[1])
