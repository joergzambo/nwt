"""Gegenrechnung IPv6: expand/compress/type/eui64/prefix unabhängig in Python nachrechnen."""
import json, sys

def expand(a):
    a = a.strip().lower()
    if '::' in a:
        l, r = a.split('::')
        left = l.split(':') if l else []
        right = r.split(':') if r else []
        mid = ['0'] * (8 - len(left) - len(right))
        g = left + mid + right
    else:
        g = a.split(':')
    return ':'.join(x.zfill(4) for x in g)

def compress(full):
    g = [x.lstrip('0') or '0' for x in expand(full).split(':')]
    best, bl = -1, 0
    cs, cl = -1, 0
    for i in range(8):
        if g[i] == '0':
            if cs < 0: cs, cl = i, 1
            else: cl += 1
            if cl > bl: bl, best = cl, cs
        else:
            cs, cl = -1, 0
    if bl < 2:
        return ':'.join(g)
    return ':'.join(g[:best]) + '::' + ':'.join(g[best + bl:])

def type_of(addr):
    hx = [int(x, 16) for x in expand(addr).split(':')]
    if all(v == 0 for v in hx): return 'unspec'
    if all(v == 0 for v in hx[:7]) and hx[7] == 1: return 'loop'
    b0 = hx[0]
    if (b0 & 0xff00) == 0xff00: return 'mcast'
    if (b0 & 0xffc0) == 0xfe80: return 'll'
    if (b0 & 0xfe00) == 0xfc00: return 'ula'
    if (b0 & 0xe000) == 0x2000: return 'gua'
    return 'other'

def eui64(mac):
    m = ''.join(c for c in mac.lower() if c in '0123456789abcdef')
    b0 = int(m[:2], 16) ^ 0x02
    mid = m[:6] + 'fffe' + m[6:]
    full = ('%02x' % b0) + mid[2:]
    return ':'.join(full[i:i + 4] for i in range(0, 16, 4))

def net_prefix(addr, plen):
    f = [int(x, 16) for x in expand(addr).split(':')]
    for i in range(8):
        hi = i * 16
        if hi >= plen: f[i] = 0; continue
        within = plen - hi
        if within < 16:
            mask = (0xffff << (16 - within)) & 0xffff
            f[i] &= mask
    return compress(':'.join('%04x' % v for v in f))

def expect(t):
    k = t['kind']
    if k == 'compress': return compress(t['given'])
    if k == 'expand': return expand(t['given'])
    if k == 'type': return type_of(t['given'])
    if k == 'prefix': return net_prefix(t['given'], t['plen'])
    if k == 'eui64':
        pre = expand(t['prefix'].split('/')[0]).split(':')[:4]
        return compress(':'.join(pre + eui64(t['mac']).split(':')))
    return None

def main(fn):
    d = json.load(open(fn)); bad = 0
    for t in d:
        exp = expect(t)
        if exp != t['ans']:
            bad += 1
            if bad <= 20: print(t['code'], t['kind'], 'erwartet', exp, 'bekam', t['ans'])
    print(len(d), 'Aufgaben geprüft,', bad, 'Abweichungen')
    sys.exit(1 if bad else 0)

main(sys.argv[1])
