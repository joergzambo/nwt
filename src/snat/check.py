"""Unabhängige Gegenrechnung Static NAT: aus den Cisco-Befehlen neu geparst und übersetzt."""
import json, sys, ipaddress
def parse(cmds):
    one, fwd = {}, {}
    for c in cmds:
        w = c.split()
        assert w[:5] == ['ip', 'nat', 'inside', 'source', 'static'], c
        if w[5] == 'tcp': fwd[(w[8], int(w[9]))] = (w[6], int(w[7]))
        else: one[w[6]] = w[5]
    return one, fwd
def main(p):
    data = json.load(open(p)); bad = 0; st = {'drop': 0, 'proxy': 0, 'own': 0, 'none': 0}
    for t in data:
        one, fwd = parse(t['cmds']); err = []
        net = ipaddress.ip_network(t['wan'] + '/29', strict=False)
        for a in list(one) + [g for g, _ in fwd] + [t['isp'], t['free']]:
            if ipaddress.ip_address(a) not in net or a in (str(net.network_address), str(net.broadcast_address)): err.append('wan-netz ' + a)
        if len(set(one) | {t['wan'], t['isp'], t['free']}) != len(one) + 3: err.append('adresskonflikt')
        if any(g != t['wan'] for g, _ in fwd): err.append('pf nicht auf wan')
        if len(set(one.values()) | {l for l, _ in fwd.values()}) != len(t['cmds']): err.append('server doppelt')
        for k in t['pkts']:
            key = (k['ip'], k['port'])
            exp = '%s:%d' % fwd[key] if key in fwd else (one[k['ip']] + ':%d' % k['port'] if k['ip'] in one else None)
            if exp != k['to']: err.append('eingehend')
            if exp is None: st['drop'] += 1
            if exp and exp not in k['opts']: err.append('option fehlt')
            if len(set(k['opts'])) != len(k['opts']): err.append('option doppelt')
        ip, port = t['back']['from'].rsplit(':', 1); port = int(port)
        rev = {v: g for g, v in fwd.items()}
        exp = '%s:%d' % rev[(ip, port)] if (ip, port) in rev else next(g for g, l in one.items() if l == ip) + ':%d' % port
        if exp != t['back']['want'] or exp not in t['back']['opts']: err.append('rueckweg')
        a = t['arp']['ip']; exp = 'own' if a == t['wan'] else 'proxy' if a in one else 'none'
        if exp != t['arp']['want']: err.append('arp')
        st[exp] += 1
        if not any(k['to'] for k in t['pkts']): err.append('kein treffer')
        if err: bad += 1; print(t['code'], err)
    print(len(data), 'Aufgaben geprüft,', bad, 'Abweichungen ·', st)
    sys.exit(1 if bad else 0)
main(sys.argv[1])
