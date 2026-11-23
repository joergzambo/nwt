"""Unabhängige Gegenrechnung SSH/RADIUS: Sicherheitslücken aus der Config neu erkennen."""
import json, sys
def detect(cfg):
    flaws = set(); sect = None; con_auth = False; vty_auth = False; con_seen = False; vty_seen = False
    for ln in cfg:
        s = ln.strip()
        if s.startswith('line console'): sect = 'con'; con_seen = True; continue
        if s.startswith('line vty'): sect = 'vty'; vty_seen = True; continue
        if s and not s.startswith('!') and not ln.startswith(' '): sect = None  # globaler Befehl beendet Block
        if 'transport input' in s and 'telnet' in s: flaws.add('telnet')
        if s.startswith('ip ssh version 1'): flaws.add('sshv1')
        if 'exec-timeout 0 0' in s: flaws.add('notimeout')
        if s.startswith('enable password'): flaws.add('enablepw')
        if 'modulus 512' in s: flaws.add('weakkey')
        if sect == 'con' and (s.startswith('login') or s.startswith('password')): con_auth = True
        if sect == 'vty' and (s.startswith('login local') or s.startswith('login authentication')): vty_auth = True
    if con_seen and not con_auth: flaws.add('console')
    if vty_seen and not vty_auth: flaws.add('novtyauth')
    return flaws
def main(fn):
    d = json.load(open(fn)); bad = 0
    for t in d:
        got = detect(t['config']); want = set(t['flaws'])
        if got != want: bad += 1; print(t['code'], 'erwartet', sorted(want), 'erkannt', sorted(got))
    print(len(d), 'Aufgaben geprüft,', bad, 'Abweichungen')
    sys.exit(1 if bad else 0)
main(sys.argv[1])
