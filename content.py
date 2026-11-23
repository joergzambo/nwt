"""Inhalte der NWT-Plattform (nwt.joergzambo.com).

Neues Thema online stellen: fertige Seite als tools/<name>.html ablegen
und beim Thema "tool": "<name>" eintragen. Themen ohne "tool" erscheinen als „in Vorbereitung“.
"""

SITE = {
    'name': 'NWT',
    'domain': 'nwt.joergzambo.com',
    'claim': 'Netzwerktechnik lernen',
    'description': 'NWT – Netzwerktechnik lernen mit Animationen, Erklärungen und Übungen: Switching, Routing, IP-Services und Netzwerksicherheit.',
    'intro': 'Topologien durchschauen, verstehen, warum das Netz so entscheidet, selbst konfigurieren – und üben, bis es sitzt. '
             'Vom OSI-Modell bis zu Angriffen im LAN, mit Animationen, Lösungen zum Aufklappen und Zufallsgenerator.',
    'news': ['<strong>Neu:</strong> <a href="netzwerksicherheit/vtp-dtp-hijacking/">VTP-Hijacking und VLAN-Hopping mit Yersinia</a> – Switch-Spoofing über DTP und die VLAN-Datenbank per VTP überschreiben, mit Wireshark, Lab und Schutz. '
             'Außerdem <a href="switching/vtp-dtp/">VTP und DTP</a> – die VLAN-Datenbank verteilen samt Revisions-Falle und Trunks automatisch aushandeln, mit interaktiver Aushandel-Tabelle und Zufallsgenerator. '
             'Außerdem <a href="netzwerksicherheit/hsrp-hijacking/">HSRP-Hijacking mit Yersinia</a> – das virtuelle Gateway mit Priorität 255 übernehmen, im Wireshark erkennen, Schutz mit MD5-Authentifizierung. '
             'In <a href="routing/ospf-2/#ersparnis">OSPF 2</a> zeigt ein Schieberegler bis 50 Router, wie viele Full-Nachbarschaften der DR erspart. Auf den ACL-Seiten gibt es den Trainer „Platzierung üben“. '
             'Außerdem <a href="netzwerksicherheit/standard-acl/">Standard-Access-Listen</a> und <a href="netzwerksicherheit/extended-acl/">Extended-Access-Listen</a> – Paket-Tester Zeile für Zeile, Wildcard-Rechner, Platzierung im Netzplan, Übungen. '
             'Außerdem <a href="switching/etherchannel/">EtherChannel: LACP und PAgP</a> – Kabel bündeln statt blockieren, welche Modi passen, Praxisbeispiel mit zwei Dark-Fiber-Leitungen. '
             'Außerdem <a href="ip-services/hsrp-vrrp/">HSRP (und VRRP)</a> – ein Gateway, das nicht ausfällt: Animation, Preempt, Tracking mit IP SLA (mit Lizenzhinweis) und VRRP im Vergleich. '
             'Außerdem <a href="grundlagen/zahlensysteme/">Zahlensysteme</a> – Bezahlen mit echtem Euro-Geld und Zweierscheinen, Umrechner mit Rechenweg, ein eigenes Smiley-Zahlensystem, Base64 und ASCII. '
             'Außerdem <a href="grundlagen/ip-grundlagen/">IP-Adresse, Subnetzmaske und Gateway</a> – ganz einfach erklärt, mit Dotted Decimal, CIDR, Gateway-Animation und einem Blick auf IPv6. '
             'Außerdem <a href="grundlagen/netzadresse/">Netzadresse berechnen</a> – IP UND Maske als Animation, gleiches Netz?, Gateway-Check, mit Übungen und Zufallsgenerator. '
             'Außerdem <a href="ip-services/static-nat/">Static NAT und Portweiterleitung</a> – Server von außen erreichbar machen, Heimrouter vs. Firewall, Proxy ARP. '
             'Außerdem <a href="ip-services/pat/">PAT</a> – Animation mit NAT-Tabelle (Port merken, IP tauschen), die vier Adressbegriffe, CGNAT und der Anspruch auf eine öffentliche IP in Österreich. '
             'Außerdem <a href="routing/show-ip-route/">Die Routing-Tabelle lesen</a> – show ip route Zeile für Zeile, administrative Distanzen und welche Route bei mehreren Protokollen gewinnt. '
             'Außerdem <a href="netzwerksicherheit/arp-spoofing/">ARP-Spoofing</a> – Man-in-the-Middle mit Ettercap, im Wireshark erkennen, Schutz mit Dynamic ARP Inspection. '
             'Außerdem <a href="netzwerksicherheit/rogue-dhcp/">Rogue-DHCP-Server</a> – falsches Gateway unterschieben als Man-in-the-Middle, Schutz mit DHCP Snooping (Cisco) und DHCP Guarding (UniFi). '
             'Außerdem <a href="netzwerksicherheit/dhcp-starvation/">DHCP-Starvation</a> – Angriff mit Yersinia, im Wireshark nachvollziehen, Schutz mit Port-Security und DHCP Snooping. '
             'Außerdem <a href="routing/ospf-3/">OSPF 3: Multi-Area-OSPF</a> – Areas, ABR und Kurzfassungen zum Erkunden, O oder O IA, mit Übungen. '
             'Außerdem <a href="routing/ospf-2/">OSPF 2: Backbone Area, DR/BDR und LSDB</a> – wie Router den Netzplan austauschen, DR/BDR-Wahl zum Ausprobieren, Referenzbandbreite. '
             'Außerdem <a href="routing/ospf-1/">OSPF 1: Dijkstra-Algorithmus</a> – eigener Dijkstra-Solver Schritt für Schritt, Kosten als Zahlen oder aus Bandbreiten, mit Übungen. '
             'Außerdem <a href="switching/cdp/">CDP – Nachbarn erkennen</a> – aus CDP-Ausgaben Modelle und IPs ablesen und den Netzplan verkabeln. '
             'Außerdem <a href="switching/layer-3-switching/">Layer-3-Switching</a> – SVIs, Routed Port und Trunk zum Router, mit Konfiguration zum Ausprobieren und Fehlersuche-Übungen. '
             'Außerdem <a href="routing/routing-schleifen/">Routing-Schleifen</a> – Count to Infinity, Split Horizon und Route Poisoning als Animation, mit Übungen. '
             'Außerdem <a href="ip-services/dhcp/">DHCP und ip helper-address</a> – DORA-Ablauf als Animation und Übungen zum DHCP-Relay. '
             'Außerdem <a href="grundlagen/ethernet-switching/">Ethernet und Switching</a> – MAC-Learning zum Ausprobieren, mit ARP und Windows-Eingabeaufforderung. '
             'Außerdem <a href="grundlagen/subnetting/">Subnetting und VLSM</a> und <a href="grundlagen/supernetting/">Supernetting</a> – mit VLSM-Erklärung für eigene Beispiele. '
             'Außerdem <a href="routing/statisches-routing/">Statisches Routing</a> – ip route-Befehle zusammenstecken, eintippen und prüfen lassen. '
             'Außerdem <a href="routing/rip/">RIP</a> – welche Netze in die network-Befehle gehören, mit Übungen und Zufallsgenerator. '
             'Außerdem <a href="grundlagen/collision-broadcast-domains/">Collision und Broadcast Domains</a> – Domains im Netzplan einkreisen, mit Zufallsgenerator. '
             'Außerdem <a href="grundlagen/osi-modell/">Das OSI-Modell zum Ziehen</a> – Schichten, PDUs, Geräte und Protokolle zuordnen, mit Lückentext-Generator. '
             'Außerdem <a href="routing/inter-vlan-routing/">Inter-VLAN-Routing</a> – Paketweg Schritt für Schritt und Fehlersuche in echten Configs. '
             'Außerdem <a href="switching/vlan/">VLANs und Trunking</a> – Broadcasts verfolgen, 802.1Q-Tags verstehen, '
             'Native-VLAN-Mismatch entdecken. Dazu <a href="switching/spanning-tree/">Spanning Tree und RSTP</a> mit 50 Übungen.'],
}

AREAS = [
    {'slug': 'grundlagen', 'title': 'Grundlagen', 'text': 'Schichtenmodelle, Adressierung und wie Daten im LAN unterwegs sind.',
     'topics': [
         {'slug': 'zahlensysteme', 'title': 'Zahlensysteme: Binär, Oktal, Hexadezimal', 'tool': 'zahlensysteme',
          'text': 'Bezahlen mit Zweierscheinen, Umrechner mit Rechenweg, ein eigenes Zahlensystem aus Smileys – und was Base64 und ASCII damit zu tun haben. Mit Übungen und Zufallsgenerator.'},
         {'slug': 'ip-grundlagen', 'title': 'IP-Adresse, Subnetzmaske und Gateway', 'tool': 'ip-grundlagen',
          'text': 'Ganz einfach erklärt: IP-Adresse als Hausadresse, Dotted Decimal, Subnetzmaske, CIDR, wozu das Gateway da ist – und ein Blick auf IPv6. Mit Quiz und Schnelltraining.'},
         {'slug': 'netzadresse', 'title': 'Netzadresse berechnen', 'tool': 'netzadresse',
          'text': 'IP-Adresse UND Subnetzmaske, Bit für Bit als Animation. Gleiches Netz?, passt das Gateway? – mit Übungen und Zufallsgenerator.'},
         {'slug': 'osi-modell', 'title': 'Das OSI- und TCP/IP-Modell', 'tool': 'osi-modell',
          'text': 'Schichten, PDUs, Geräte und Protokolle per Drag-and-Drop zuordnen – plus Lückentext-Generator, Eselsbrücken und Kapselung.'},
         {'slug': 'subnetting', 'title': 'Subnetting und VLSM', 'tool': 'subnetting',
          'text': 'Subnetzmaske, Netz- und Broadcastadresse, gleich große Subnetze und VLSM – mit eigenem Beispiel Schritt für Schritt erklärt.'},
         {'slug': 'supernetting', 'title': 'Supernetting', 'tool': 'supernetting',
          'text': 'Netze zu einer Route zusammenfassen – binär erklärt, mit Übungen und Zufallsgenerator.'},
         {'slug': 'collision-broadcast-domains', 'title': 'Collision und Broadcast Domains', 'tool': 'collision-broadcast-domains',
          'text': 'Hub, Switch oder Router – wer trennt was? Domains im Netzplan einkreisen, mit 18 Übungen und Zufallsgenerator.'},
         {'slug': 'ethernet-switching', 'title': 'Ethernet und Switching', 'tool': 'ethernet-switching',
          'text': 'Ethernet-Frame, MAC-Adressen und MAC-Learning: Frames senden, ARP mitspielen, Switch-Tabellen beobachten – mit Übungen.'},
     ]},
    {'slug': 'switching', 'title': 'Switching', 'text': 'Redundanz ohne Schleifen und logische Trennung im LAN.',
     'topics': [
         {'slug': 'spanning-tree', 'title': 'Spanning Tree und RSTP', 'tool': 'spanning-tree',
          'text': 'Root Bridge, Root Port, Designated Port – mit Animation, 50 Übungen und Zufallsgenerator.'},
         {'slug': 'vlan', 'title': 'VLANs und Trunking', 'tool': 'vlan',
          'text': 'Access- und Trunk-Ports, 802.1Q-Tags und native VLAN – zum Ausprobieren, mit 30 Übungen und Zufallsgenerator.'},
         {'slug': 'etherchannel', 'title': 'EtherChannel: LACP und PAgP', 'tool': 'etherchannel',
          'text': 'Mehrere Kabel zu einem Port-Channel bündeln: Animation, welche Modi zusammenpassen, Voraussetzungen, show etherchannel summary – mit Übungen und Zufallsgenerator.'},
         {'slug': 'vtp-dtp', 'title': 'VTP und DTP', 'tool': 'vtp-dtp',
          'text': 'VLAN-Datenbank automatisch verteilen (VTP) samt der Revisions-Falle und Trunks automatisch aushandeln (DTP) – mit interaktiver Tabelle, Übungen und Zufallsgenerator.'},
         {'slug': 'cdp', 'title': 'CDP – Nachbarn erkennen', 'tool': 'cdp',
          'text': 'CDP-Ausgaben lesen, Modelle und IPs ablesen und den Netzplan selbst verkabeln – mit Zufallsgenerator.'},
         {'slug': 'layer-3-switching', 'title': 'Layer-3-Switching', 'tool': 'layer-3-switching',
          'text': 'SVIs, Routed Port und Trunk zum Router: Paketweg, Konfiguration zum Ausprobieren, Fehlersuche-Übungen und Zufallsgenerator.'},
     ]},
    {'slug': 'routing', 'title': 'Routing', 'text': 'Wie Pakete zwischen Netzen ihren Weg finden.',
     'topics': [
         {'slug': 'show-ip-route', 'title': 'Die Routing-Tabelle lesen', 'tool': 'show-ip-route',
          'text': 'show ip route Zeile für Zeile, administrative Distanzen, Floating Static Route und welche Route gewinnt, wenn mehrere Protokolle dasselbe Netz melden – mit Übungen.'},
         {'slug': 'inter-vlan-routing', 'title': 'Inter-VLAN-Routing', 'tool': 'inter-vlan-routing',
          'text': 'Router-on-a-Stick und Layer-3-Switch – Schritt für Schritt, mit Fehlersuche-Übungen und Zufallsgenerator.'},
         {'slug': 'statisches-routing', 'title': 'Statisches Routing', 'tool': 'statisches-routing',
          'text': 'ip route: Welches Zielnetz, welche Maske, welcher Next Hop? Mit Erklärung am Plan, Zusammenstecken, Baukasten und Zufallsgenerator.'},
         {'slug': 'rip', 'title': 'RIP', 'tool': 'rip',
          'text': 'Welche Netze kommen in die network-Befehle? Schritt für Schritt erklärt, mit Übungen, Tipps und Zufallsgenerator.'},
         {'slug': 'routing-schleifen', 'title': 'Routing-Schleifen: Count to Infinity, Split Horizon, Route Poisoning', 'tool': 'routing-schleifen',
          'text': 'Animation von Count to Infinity, Split Horizon, Route Poisoning und Poison Reverse – mit Quiz, Übungen und Zufallsgenerator.'},
         {'slug': 'ospf-1', 'title': 'OSPF 1: Dijkstra-Algorithmus', 'tool': 'ospf-1',
          'text': 'Kürzeste Wege mit Dijkstra – Solver zum Selberbauen, Schritt für Schritt mit Tabelle, Kosten als Zahlen oder aus Bandbreiten, mit Zufallsgenerator.'},
         {'slug': 'ospf-2', 'title': 'OSPF 2: Backbone Area, DR/BDR und LSDB', 'tool': 'ospf-2',
          'text': 'Wie Router mit Hello, DBD, LSR, LSU und LSAck ihren Netzplan austauschen – als Animation. DR/BDR-Wahl, Router-ID, Referenzbandbreite, Area 0 – mit Übungen und Zufallsgenerator.'},
         {'slug': 'ospf-3', 'title': 'OSPF 3: Multi-Area-OSPF', 'tool': 'ospf-3',
          'text': 'Mehrere Areas, ABR und Kurzfassungen (Typ-3-LSA): Wer sieht was, O oder O IA, network-Befehle mit Wildcard – mit Übungen und Zufallsgenerator.'},
     ]},
    {'slug': 'ip-services', 'title': 'IP-Services', 'text': 'Dienste, die ein Netz erst benutzbar machen.',
     'topics': [
         {'slug': 'pat', 'title': 'PAT (NAT Overload)', 'tool': 'pat',
          'text': 'Port merken, IP tauschen – PAT als Animation. Inside/Outside, Local/Global zum Anklicken, Cisco-Konfiguration, CGNAT und seine Probleme – mit Übungen und Zufallsgenerator.'},
         {'slug': 'static-nat', 'title': 'Static NAT und Portweiterleitung', 'tool': 'static-nat',
          'text': 'Server aus dem Internet erreichbar machen: 1:1-NAT und Portweiterleitung als Animation, Heimrouter vs. Firewall mit DMZ, Proxy ARP – mit Übungen und Zufallsgenerator.'},
         {'slug': 'dhcp', 'title': 'DHCP und ip helper-address', 'tool': 'dhcp',
          'text': 'DORA als Animation, DHCP-Relay mit giaddr – und wo der Helper hin muss. Mit Übungen und Zufallsgenerator.'},
         {'slug': 'hsrp-vrrp', 'title': 'HSRP (und VRRP)', 'tool': 'hsrp-vrrp',
          'text': 'Ein Gateway, das nicht ausfällt: virtueller Router, Wahl und Preempt als Animation, Tracking mit IP SLA (inkl. Lizenzhinweis), Cisco-Konfiguration, VRRP im Vergleich – mit Übungen und Zufallsgenerator.'},
     ]},
    {'slug': 'netzwerksicherheit', 'title': 'Netzwerksicherheit', 'text': 'Angriffe im LAN verstehen und abwehren.',
     'topics': [
         {'slug': 'wildcard-masken', 'title': 'Wildcard-Masken', 'tool': 'wildcard-masken',
          'text': 'Das Spiegelbild der Subnetzmaske: 0 = muss passen, 1 = egal. Interaktiver Rechner mit 16×16-Treffer-Raster und knifflige Rätsel (nur ungerade Hosts, zweite Hälfte, jedes 4. …) – mit Quiz, Übungen und Zufallsgenerator.'},
         {'slug': 'standard-acl', 'title': 'Standard-Access-Listen', 'tool': 'standard-acl',
          'text': 'First Match und implicit deny im Paket-Tester, Wildcard-Rechner, Konfiguration, access-class für VTY, Platzierung nahe am Ziel im Netzplan – mit Übungen und Zufallsgenerator.'},
         {'slug': 'extended-acl', 'title': 'Extended-Access-Listen', 'tool': 'extended-acl',
          'text': 'Protokoll, Quelle, Ziel und Port: Paket-Tester, wichtige Ports, named ACLs mit Sequenznummern, DMZ-Beispiel, Platzierung nahe an der Quelle – mit Übungen und Zufallsgenerator.'},
         {'slug': 'ssh-radius', 'title': 'SSH, RADIUS und Konsolenschutz', 'tool': 'ssh-radius',
          'text': 'Warum Telnet ausgedient hat: SSH einrichten, Konsole und VTY absichern, zentrale Anmeldung per RADIUS (AAA). Mit „Finde die Sicherheitslücken"-Generator, Quiz und Übungen.'},
         {'slug': 'arp-spoofing', 'title': 'ARP-Spoofing', 'tool': 'arp-spoofing',
          'text': 'Man-in-the-Middle im LAN mit Ettercap: warum ARP angreifbar ist, im Wireshark erkennen, Schutz mit Dynamic ARP Inspection – mit Übungen und Zufallsgenerator.'},
         {'slug': 'dhcp-starvation', 'title': 'DHCP-Starvation', 'tool': 'dhcp-starvation',
          'text': 'Den Adresspool mit Yersinia leeren: warum DHCP angreifbar ist, SPAN und Wireshark, Schutz mit Port-Security und DHCP Snooping – mit Übungen und Zufallsgenerator.'},
         {'slug': 'hsrp-hijacking', 'title': 'HSRP-Hijacking mit Yersinia', 'tool': 'hsrp-hijacking',
          'text': 'Das virtuelle HSRP-Gateway mit Yersinia übernehmen – Man-in-the-Middle und Schutz mit MD5.'},
         {'slug': 'vtp-dtp-hijacking', 'title': 'VTP-Hijacking und VLAN-Hopping', 'tool': 'vtp-dtp-hijacking',
          'text': 'Mit Yersinia per DTP einen Trunk erzwingen (Switch-Spoofing, VLAN-Hopping) und die VLAN-Datenbank per VTP überschreiben – Wireshark, Lab, Schutz, Übungen und Zufallsgenerator.'},
         {'slug': 'rogue-dhcp', 'title': 'Rogue-DHCP-Server', 'tool': 'rogue-dhcp',
          'text': 'Falsches Gateway unterschieben (Man-in-the-Middle): Wettlauf der Offer, im Wireshark erkennen, Schutz mit DHCP Snooping (Cisco) und DHCP Guarding (UniFi) – mit Übungen.'},
         {'slug': 'stp-angriff', 'title': 'Angriff auf die Root Bridge', 'text': 'Gefälschte BPDUs und BPDU Guard / Root Guard.'},
         {'slug': 'rip-authentifizierung', 'title': 'RIP-Authentifizierung', 'text': 'Gefälschte Routing-Updates verhindern.'},
     ]},
]
