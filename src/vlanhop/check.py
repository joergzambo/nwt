"""Unabhaengige Gegenrechnung VTP/DTP-Hijacking: Port- und VTP-Konfiguration neu einlesen."""
import json, sys, re

def is_access(m): return m in ('access', 'access-noneg')
def is_trunk(m): return m in ('trunk', 'trunk-noneg')
def sends(m): return m not in ('trunk-noneg', 'access-noneg')
def op(self, peer):
    if is_access(self): return 'access'
    if is_trunk(self): return 'trunk'
    if self == 'auto':
        return 'trunk' if (sends(peer) and (peer == 'desirable' or is_trunk(peer))) else 'access'
    if is_access(peer): return 'access'
    if not sends(peer): return 'access'
    return 'trunk' if (is_trunk(peer) or peer in ('desirable', 'auto')) else 'access'

def parse_port(cfg):
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

def parse_vtp(cfg):
    mode = None; pw = False
    for line in cfg.split('\n'):
        m = re.match(r'vtp mode (\w+)', line.strip())
        if m: mode = m.group(1)
        if line.strip().startswith('vtp password'): pw = True
    return mode, pw

def main(fn):
    d = json.load(open(fn)); bad = 0; st = {'trunk': 0, 'hijack': 0}
    for t in d:
        pm = parse_port(t['pc']); vm, pw = parse_vtp(t['vc'])
        if pm != t['portMode'] or vm != t['vtpMode'] or pw != t['vtpPass']:
            bad += 1; print(t['code'], 'parse', (pm, vm, pw), 'vs', (t['portMode'], t['vtpMode'], t['vtpPass'])); continue
        trunk = op(pm, 'desirable') == 'trunk'
        hijack = trunk and vm in ('server', 'client') and not pw
        r = t['res']
        if r['trunk'] != trunk or r['hijack'] != hijack:
            bad += 1; print(t['code'], (trunk, hijack), 'vs', (r['trunk'], r['hijack']))
        st['trunk'] += trunk; st['hijack'] += hijack
    print(len(d), 'Aufgaben geprueft,', bad, 'Abweichungen ·', st)
    sys.exit(1 if bad else 0)
main(sys.argv[1])
