"""Unabhängige Gegenrechnung FHRP: Router aus der Cisco-Konfiguration neu einlesen und Wahl/Preempt/Tracking nachspielen."""
import json, sys, re
from collections import Counter
def parse(cfg, proto):
    ip = re.search(r'ip address (\S+)', cfg).group(1)
    m = re.search(r'(?:standby|vrrp) \d+ priority (\d+)', cfg); prio = int(m.group(1)) if m else 100
    if proto == 'HSRP': pre = bool(re.search(r'standby \d+ preempt', cfg))
    else: pre = not re.search(r'no vrrp \d+ preempt', cfg)
    m = re.search(r'track 1 decrement (\d+)', cfg); dec = int(m.group(1)) if m else 0
    trk = 'sla' if 'track 1 ip sla 1 reachability' in cfg else 'if' if 'track 1 interface Gi0/1' in cfg else ''
    return dict(ip=tuple(map(int, ip.split('.'))), prio=prio, pre=pre, dec=dec, trk=trk)
def mac(proto, g, ver):
    if proto == 'VRRP': return '0000.5e00.01%02x' % g
    return '0000.0c9f.f%03x' % g if ver == 2 else '0000.0c07.ac%02x' % g
def main(p):
    d = json.load(open(p)); bad = 0; st = Counter()
    for t in d:
        R = [parse(c, t['proto']) for c in t['cfg']]; n = len(R)
        up = [True]*n; link = [True]*n; isp = [True]*n
        def eff(i):
            t = R[i]['trk']; bad = (not link[i]) if t == 'if' else (not link[i] or not isp[i]) if t == 'sla' else False
            return R[i]['prio'] - (R[i]['dec'] if bad else 0)
        key = lambda i: (eff(i), R[i]['ip'])
        act = max(range(n), key=key); got = [act]
        for e in t['events']:
            i = e['r']
            if e['t'] == 'fail':
                up[i] = False
                if act == i: act = max([k for k in range(n) if up[k]], key=key)
            elif e['t'] == 'back': up[i] = True
            elif e['t'] == 'linkdown': link[i] = False
            elif e['t'] == 'linkup': link[i] = True
            elif e['t'] == 'ispdown': isp[i] = False
            elif e['t'] == 'ispup': isp[i] = True
            c = [k for k in range(n) if up[k] and k != act and R[k]['pre'] and eff(k) > eff(act)]
            if c: act = max(c, key=key)
            got.append(act)
        err = []
        if got != t['hist']: err.append(('ablauf', got, t['hist']))
        if t['mac'] != mac(t['proto'], t['g'], t['ver']) or t['mac'] not in t['macOpts'] or len(set(t['macOpts'])) != len(t['macOpts']) or len(t['macOpts']) < 3: err.append('mac')
        if any(t['vip'] == '.'.join(map(str, r['ip'])) for r in R): err.append('vip = router-ip')
        st['wechsel' if got[0] != got[-1] else 'kein wechsel'] += 1; st[t['proto']] += 1; st['sla'] += any(r['trk'] == 'sla' for r in R); st['isp-falle'] += any(e['t'] == 'ispdown' for e in t['events']) and got[0] == got[-1]
        if err: bad += 1; print(t['code'], err)
    print(len(d), 'Aufgaben geprüft,', bad, 'Abweichungen ·', dict(st))
    sys.exit(1 if bad else 0)
main(sys.argv[1])
