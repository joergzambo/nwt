"""Unabhaengige Gegenrechnung DTP: Konfiguration beider Ports neu einlesen und aushandeln."""
import json, sys, re

def parse_mode(cfg):
    static = None; dyn = None; noneg = False
    for line in cfg.split('\n'):
        line = line.strip()
        m = re.match(r'switchport mode dynamic (auto|desirable)$', line)
        if m: dyn = m.group(1); continue
        m = re.match(r'switchport mode (access|trunk)$', line)
        if m: static = m.group(1); continue
        if line == 'switchport nonegotiate': noneg = True
    if dyn: return dyn
    if static == 'trunk': return 'trunk-noneg' if noneg else 'trunk'
    if static == 'access': return 'access-noneg' if noneg else 'access'
    return None

def is_access(m): return m in ('access', 'access-noneg')
def is_trunk(m): return m in ('trunk', 'trunk-noneg')
def sends(m): return m not in ('trunk-noneg', 'access-noneg')

def op(self, peer):
    if is_access(self): return 'access'
    if is_trunk(self): return 'trunk'
    if self == 'auto':
        return 'trunk' if (sends(peer) and (peer == 'desirable' or is_trunk(peer))) else 'access'
    # desirable
    if is_access(peer): return 'access'
    if not sends(peer): return 'access'
    return 'trunk' if (is_trunk(peer) or peer in ('desirable', 'auto')) else 'access'

def main(fn):
    d = json.load(open(fn)); bad = 0; st = {'trunk': 0, 'access': 0, 'mismatch': 0}
    for t in d:
        a = parse_mode(t['c1']); b = parse_mode(t['c2'])
        if a != t['m1'] or b != t['m2']:
            bad += 1; print(t['code'], 'mode-parse', (a, b), 'vs', (t['m1'], t['m2'])); continue
        oa, ob = op(a, b), op(b, a)
        outcome = oa if oa == ob else 'mismatch'
        r = t['res']
        if r['outcome'] != outcome or r['a'] != oa or r['b'] != ob:
            bad += 1; print(t['code'], (outcome, oa, ob), 'vs', (r['outcome'], r['a'], r['b']))
        st[outcome] += 1
    print(len(d), 'Aufgaben geprueft,', bad, 'Abweichungen ·', st)
    sys.exit(1 if bad else 0)
main(sys.argv[1])
