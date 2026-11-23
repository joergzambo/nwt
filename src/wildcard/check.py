"""Unabhängige Gegenrechnung Wildcard: Treffermenge aus aOct/wOct neu berechnen."""
import json, sys
def match(aOct, wOct):
    return [v for v in range(256) if ((v ^ aOct) & (~wOct & 255)) == 0]
def main(fn):
    d = json.load(open(fn)); bad = 0
    for t in d:
        s = match(t['aOct'], t['wOct'])
        err = []
        if len(s) != t['count']: err.append(('count', len(s), t['count']))
        # Wildcard-Oktett muss aus zusammenhängenden "don't care"-Bits bestehen? Nein – beliebig erlaubt.
        # Aber aOct darf in den "must match"-Bits keine don't-care-Überlappung haben (immer ok hier)
        if t['octIdx'] not in (2, 3): err.append('octIdx')
        if err: bad += 1; print(t['code'], err)
    print(len(d), 'Aufgaben geprüft,', bad, 'Abweichungen')
    sys.exit(1 if bad else 0)
main(sys.argv[1])
