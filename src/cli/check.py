"""Unabhängige Gegenrechnung IOS-Dateiname: aus dem Dateinamen Plattform, Feature, Version neu ableiten."""
import json, sys, re
def decode(fn):
    m = re.match(r'^([a-z0-9_]+)-([a-z0-9_]+)-mz\.SPA\.(\d+)-(\d+)\.([MEST])(\d+)\.bin$', fn)
    if not m: return None
    plat, feat, majmin, rebuild, train, maint = m.groups()
    maj = majmin[:-1]; mn = majmin[-1]
    human = maj + '.' + mn + '(' + rebuild + ')' + train + maint
    return {'plat': plat, 'feat': feat, 'human': human}
def main(fn):
    d = json.load(open(fn)); bad = 0
    for t in d:
        got = decode(t['filename']); err = []
        if not got: err.append('nicht parsebar')
        else:
            if got['plat'] != t['plat']: err.append(('plat', got['plat'], t['plat']))
            if got['feat'] != t['feat']: err.append(('feat', got['feat'], t['feat']))
            if got['human'] != t['human']: err.append(('ver', got['human'], t['human']))
        if err: bad += 1; print(t['code'], t['filename'], err)
    print(len(d), 'Aufgaben geprüft,', bad, 'Abweichungen')
    sys.exit(1 if bad else 0)
main(sys.argv[1])
