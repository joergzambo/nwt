"""Unabhängige Gegenrechnung EtherChannel: Konfiguration beider Switches neu einlesen und bewerten."""
import json, sys, re
from collections import Counter
PROTO = {'active': 'LACP', 'passive': 'LACP', 'desirable': 'PAgP', 'auto': 'PAgP', 'on': 'on'}
def parse(cfg, n, base):
    ports = {}; cur = []
    for line in cfg.split('\n'):
        m = re.match(r'interface range Gi1/0/(\d+) - (\d+)', line)
        if m: cur = list(range(int(m.group(1)), int(m.group(2)) + 1)); [ports.setdefault(i, {'speed': 1000, 'mode': None, 'vlan': 1}) for i in cur]; continue
        m = re.match(r'interface Gi1/0/(\d+)', line)
        if m: cur = [int(m.group(1))]; ports.setdefault(cur[0], {'speed': 1000, 'mode': None, 'vlan': 1}); continue
        for i in cur:
            if line.strip() == 'speed 100': ports[i]['speed'] = 100
            m = re.match(r'\s*switchport mode (\w+)', line)
            if m: ports[i]['mode'] = m.group(1)
            m = re.match(r'\s*switchport access vlan (\d+)', line)
            if m: ports[i]['vlan'] = int(m.group(1))
            m = re.match(r'\s*channel-group \d+ mode (\w+)', line)
            if m: ports[i]['cm'] = m.group(1)
    return [ports[base + i] for i in range(n)]
def key(p): return (p['speed'], p['mode'], p['vlan'] if p['mode'] == 'access' else None)
def main(fn):
    d = json.load(open(fn)); bad = 0; st = Counter()
    for t in d:
        A = parse(t['c1'], t['n'], t['base']); B = parse(t['c2'], t['n'], t['base'])
        a, b = A[0]['cm'], B[0]['cm']; pa, pb = PROTO[a], PROTO[b]
        if pa != pb: ok = False
        elif pa == 'on': ok = True
        else: ok = a in ('active', 'desirable') or b in ('active', 'desirable')
        bundled = [i for i in range(t['n']) if ok and key(A[i]) == key(A[0]) and key(B[i]) == key(B[0]) and key(A[i]) == key(B[i])]
        r = t['res']; err = []
        if r['bundled'] != bundled: err.append(('bundled', bundled, r['bundled']))
        if r['formed'] != (len(bundled) > 0): err.append('formed')
        if r['bw'] != 1000 * len(bundled): err.append('bw')
        exp_proto = (pa if pa == pb else None)
        if r['proto'] != exp_proto: err.append(('proto', exp_proto, r['proto']))
        if ok and not bundled: err.append('formed ohne port')
        st['gebildet' if r['formed'] else 'nicht'] += 1; st['suspended'] += bool(r['susp']) and r['formed']
        if err: bad += 1; print(t['code'], err)
    print(len(d), 'Aufgaben geprüft,', bad, 'Abweichungen ·', dict(st))
    sys.exit(1 if bad else 0)
main(sys.argv[1])
