"""Gegenrechnung TCP/UDP: Port/Proto laut Katalog, Szenario-Antwort ist TCP oder UDP."""
import json, sys
CAT = {'HTTP':(80,'TCP'),'HTTPS':(443,'TCP'),'SSH':(22,'TCP'),'Telnet':(23,'TCP'),'DNS':(53,'UDP'),
 'FTP (Steuerung)':(21,'TCP'),'SMTP':(25,'TCP'),'POP3':(110,'TCP'),'IMAP':(143,'TCP'),'DHCP (Server)':(67,'UDP'),
 'TFTP':(69,'UDP'),'SNMP':(161,'UDP'),'NTP':(123,'UDP'),'Syslog':(514,'UDP'),'RDP':(3389,'TCP')}
def main(fn):
    d = json.load(open(fn)); bad = 0
    for t in d:
        err = []
        if t['type'] == 'port':
            p, pr = CAT.get(t['svc'], (None, None))
            if p != t['port']: err.append(('port', p, t['port']))
            if pr != t['proto']: err.append(('proto', pr, t['proto']))
        else:
            if t['ans'] not in ('TCP', 'UDP'): err.append('scen-ans')
        if err: bad += 1; print(t['code'], err)
    print(len(d), 'Aufgaben geprüft,', bad, 'Abweichungen'); sys.exit(1 if bad else 0)
main(sys.argv[1])
