"""Unabhängige Gegenrechnung PAT: Port-Vergabe, Rückweg, Begriffe, Plausibilität."""
import json, sys
def solve(pub, conns):
    taken, res = set(), []
    for c in conns:
        port = c['sport']
        if port in taken:
            port = next(p for p in range(1024, 65536) if p not in taken)
        taken.add(port)
        res.append((f"{c['ip']}:{c['sport']}", f"{pub}:{port}", f"{c['dip']}:{c['dport']}", port))
    return res
def main(p):
    data = json.load(open(p)); bad = 0; coll = 0; unk = 0
    for t in data:
        exp = solve(t['pub'], t['conns']); err = []
        got = [(r['il'], r['ig'], r['og'], r['port']) for r in t['rows']]
        if exp != got: err.append('tabelle')
        if any(r['ol'] != r['og'] for r in t['rows']): err.append('ol')
        if len({e[1] for e in exp}) != len(exp): err.append('ig nicht eindeutig')
        if len({(c['ip'], c['sport']) for c in t['conns']}) != len(t['conns']): err.append('doppelte verbindung')
        m = [i for i, e in enumerate(exp) if e[3] == t['reply']['port']]
        if len(m) > 1: err.append('rueckweg mehrdeutig')
        host = t['conns'][m[0]]['host'] if m else -1
        to = exp[m[0]][0] if m else None
        if host != t['reply']['host'] or to != t['reply']['to']: err.append('rueckweg')
        k, a = t['term']['kind'], t['term']['addr']
        ips_in = {h['ip'] for h in t['hosts']}; ips_out = {s['ip'] for s in t['servers']}
        want = 'IL' if a in ips_in else 'IG' if a == t['pub'] else 'OG' if a in ips_out else '?'
        if want != k or k not in t['term']['accept']: err.append('begriff')
        if ips_in & ips_out or t['pub'] in ips_in | ips_out: err.append('adressen ueberlappen')
        if any(e[3] != c['sport'] for e, c in zip(exp, t['conns'])): coll += 1
        if not m: unk += 1
        if err: bad += 1; print(t['code'], err)
    print(len(data), 'Aufgaben geprüft,', bad, 'Abweichungen ·', coll, 'mit Port-Kollision ·', unk, 'mit unbekanntem Port')
    sys.exit(1 if bad else 0)
main(sys.argv[1])
