"""Unabhängige Gegenrechnung ACL: Zeilentext neu parsen, mit ipaddress auswerten; Platzierung aus eigener Tabelle."""
import json, sys, ipaddress as I
from collections import Counter
PORTS = {}
def addr(tok, i):
    if tok[i] == 'any': return (0, 0xFFFFFFFF), i + 1
    if tok[i] == 'host': return (int(I.ip_address(tok[i + 1])), 0), i + 2
    return (int(I.ip_address(tok[i])), int(I.ip_address(tok[i + 1]))), i + 2
def m(ip, a): return (int(I.ip_address(ip)) & ~a[1] & 0xFFFFFFFF) == (a[0] & ~a[1] & 0xFFFFFFFF)
def parse(line):
    t = line.split(); num = int(t[1]); act = t[2]
    if num < 100 or 1300 <= num <= 1999:
        s, _ = addr(t, 3); return dict(std=True, act=act, src=s)
    proto = t[3]; s, i = addr(t, 4); d, i = addr(t, i); op = None; ic = None
    if i < len(t) and t[i] in ('eq', 'neq', 'lt', 'gt', 'range'):
        op = (t[i], int(t[i + 1]), int(t[i + 2]) if t[i] == 'range' else None); i += 3 if t[i] == 'range' else 2
    if i < len(t) and t[i] in ('echo', 'echo-reply'): ic = t[i]
    return dict(std=False, act=act, proto=proto, src=s, dst=d, op=op, icmp=ic)
def pok(op, p):
    if not op: return True
    k, a, b = op
    return {'eq': p == a, 'neq': p != a, 'lt': p < a, 'gt': p > a, 'range': b is not None and a <= p <= b}[k]
def ev(L, pk):
    for i, l in enumerate(L):
        if l['std']:
            if m(pk['src'], l['src']): return l['act'], i
            continue
        if l['proto'] != 'ip' and l['proto'] != pk['proto']: continue
        if not (m(pk['src'], l['src']) and m(pk['dst'], l['dst'])): continue
        if l['proto'] in ('tcp', 'udp') and not pok(l['op'], pk['port']): continue
        if l['proto'] == 'icmp' and l['icmp'] and pk.get('icmp') != l['icmp']: continue
        return l['act'], i
    return 'deny', -1
LAN = {'Ricky': ('A', 'E0'), 'Jenny': ('A', 'E0'), 'George': ('C', 'FA1'), 'Carrol': ('C', 'FA1'), 'Amanda': ('C', 'FA1'), 'Kathy': ('C', 'FA1'), 'Jeff': ('D', 'E0'), 'Jim': ('D', 'E0'), 'Linda': ('E', 'E0'), 'Sarah': ('E', 'E0'), 'Jackie': ('F', 'FA1'), 'Melvin': ('F', 'FA1')}
def main(fn):
    d = json.load(open(fn)); bad = 0; st = Counter()
    for t in d:
        err = []; L = [parse(x) for x in t['txt']]
        for pk in t['tests']:
            a, i = ev(L, pk); r = pk['res']
            if (a, i) != (r['act'], r['line']): err.append(('eval', pk, (a, i), r))
            st['implizit' if i < 0 else 'zeile'] += 1
        if t.get('wild'):
            w = t['wild']; net = I.ip_network(f"{w['base']}/{w['p']}", strict=True)
            if (str(net.network_address), str(net.broadcast_address)) != (w['first'], w['last']): err.append('wild')
            if str(I.ip_address(0xFFFFFFFF ^ int(net.netmask))) != w['wc']: err.append('wc')
        p = t['place']; a, b = LAN[p['src']], LAN[p['dst']]; std = t['kind'] == 'std'
        exp = {'none': True} if a == b else ({'router': b[0], 'ifc': b[1], 'dir': 'out'} if std else {'router': a[0], 'ifc': a[1], 'dir': 'in'})
        if exp != p['ans']: err.append(('place', exp, p['ans']))
        st['gleiches LAN'] += a == b
        if len(set(x['src'] + str(x.get('port')) + str(x.get('proto')) for x in t['tests'])) != len(t['tests']): err.append('doppelt')
        if err: bad += 1; print(t['code'], err[:2])
    print(len(d), 'Aufgaben geprüft,', bad, 'Abweichungen ·', dict(st))
    sys.exit(1 if bad else 0)
main(sys.argv[1])
