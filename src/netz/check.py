"""Unabhängige Gegenrechnung Netzadresse mit Pythons ipaddress-Modul."""
import json, sys, ipaddress as I
from collections import Counter
def main(p):
    data = json.load(open(p)); bad = 0; st = Counter()
    for t in data:
        d, q, err = t['d'], t['q'], []
        n1 = I.ip_network(f"{d['ip']}/{d['mask']}", strict=False)
        if n1.prefixlen != d['p']: err.append('praefix')
        if str(n1.network_address) != d['net'] or str(n1.broadcast_address) != d['bc']: err.append('netz a')
        ip = I.ip_address(d['ip'])
        if ip in (n1.network_address, n1.broadcast_address): err.append('ip ist netz/bc')
        if not ip.is_global and not ip.is_private: err.append('ip komisch ' + d['ip'])
        gw = I.ip_address(d['gw']); ok = gw in n1 and gw not in (n1.network_address, n1.broadcast_address)
        if ok != d['gwOk']: err.append('gateway')
        if gw == ip: err.append('gw = ip')
        st['gw ok' if ok else 'gw falsch'] += 1
        n2 = I.ip_network(f"{q['a']}/{q['mask']}", strict=False); n3 = I.ip_network(f"{q['b']}/{q['mask']}", strict=False)
        if str(n2.network_address) != q['na'] or str(n3.network_address) != q['nb']: err.append('netz b')
        if (n2 == n3) != q['same']: err.append('gleich')
        if q['a'] == q['b']: err.append('a = b')
        for x in (q['a'], q['b']):
            a = I.ip_address(x); nn = I.ip_network(f"{x}/{q['mask']}", strict=False)
            if a in (nn.network_address, nn.broadcast_address): err.append('host ist netz/bc')
            if int(x.split('.')[0]) in (0, 127) or int(x.split('.')[0]) > 223: err.append('erstes oktett')
        st['gleich' if q['same'] else 'verschieden'] += 1
        if err: bad += 1; print(t['code'], err)
    print(len(data), 'Aufgaben geprüft,', bad, 'Abweichungen ·', dict(st))
    sys.exit(1 if bad else 0)
main(sys.argv[1])
