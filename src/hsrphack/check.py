"""Unabhaengige Gegenrechnung HSRP-Hijacking: eigene Nachbildung des Wahl-/Auth-Modells.

node export.js > aufgaben.json && python3 check.py aufgaben.json
"""
import json, sys

def ipn(ip):
    p = [int(x) for x in ip.split('.')]
    return (p[0] << 24) | (p[1] << 16) | (p[2] << 8) | p[3]

def sim(t):
    rs = [('R1', t['r1']['prio'], ipn(t['r1']['ip'])), ('R2', t['r2']['prio'], ipn(t['r2']['ip']))]
    rs.sort(key=lambda x: (x[1], x[2]), reverse=True)
    active = rs[0]
    att_prio, att_ip = t['att']['prio'], ipn(t['att']['ip'])
    min_prio = active[1]  # Angreifer-IP ist hoechste -> Gleichstand reicht
    att_wins = att_prio > active[1] or (att_prio == active[1] and att_ip > active[2])
    takeover = att_wins and t['auth'] != 'md5'
    return active[0], min_prio, takeover

def main(p):
    data = json.load(open(p)); bad = 0
    for t in data:
        ab, mp, to = sim(t)
        r = t['res']
        if ab != r['activeBefore'] or mp != r['minPrio'] or to != r['takeover']:
            bad += 1; print(t['code'], (ab, mp, to), 'vs', (r['activeBefore'], r['minPrio'], r['takeover']))
        # Angreifer-IP muss wirklich die hoechste sein
        if ipn(t['att']['ip']) <= max(ipn(t['r1']['ip']), ipn(t['r2']['ip'])):
            bad += 1; print(t['code'], 'Angreifer-IP nicht hoechste')
    print(len(data), 'Aufgaben geprueft,', bad, 'Abweichungen')
    sys.exit(1 if bad else 0)
main(sys.argv[1])
