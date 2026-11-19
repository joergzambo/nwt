/* Themen-Definitionen (nachladbar per Auto-Abgleich).
   build(E) bekommt die Generatoren E = {NA, SN, VD} und liefert die Themen-Map.
   Beim Ergänzen neuer Themen: hier einen Eintrag hinzufügen, zugehörigen
   Generator in engines/ ablegen, sync-manifest.json Version erhöhen. */
function build(E) {
  const NA = E.NA, SN = E.SN, VD = E.VD, EC = E.EC, ACL = E.ACL, FH = E.FH, ZS = E.ZS, IR = E.IR;
  const LV = ['L', 'M', 'S'];
  const blank = '____________';
  const BASENAME = { 2: 'Binär', 8: 'Oktal', 10: 'Dezimal', 16: 'Hexadezimal' };
  const LET = ['a', 'b', 'c', 'd', 'e', 'f'];
  return {
    'netz-adresse': {
      label: 'Netzadresse & Broadcast berechnen', levels: LV, points: { L: 2, M: 3, S: 4 }, tag: 'NET',
      gen(seed, lvl) {
        const d = NA.makeTask(seed, lvl).d;
        return { intro: 'Bestimme Netzadresse und Broadcast-Adresse.',
          lines: ['Host-IP: ' + d.ip, 'Subnetzmaske: ' + d.mask + '  (/' + d.p + ')',
                  'Netzadresse: ' + blank, 'Broadcast-Adresse: ' + blank],
          solution: ['Netzadresse: ' + d.net, 'Broadcast: ' + d.bc] };
      }
    },
    'netz-gleich': {
      label: 'Sind zwei Geräte im selben Netz?', levels: LV, points: { L: 2, M: 3, S: 4 }, tag: 'NET',
      gen(seed, lvl) {
        const q = NA.makeTask(seed, lvl).q;
        return { intro: 'Liegen die beiden Geräte im selben Netz? Begründe mit den Netzadressen.',
          lines: ['Gerät A: ' + q.a, 'Gerät B: ' + q.b, 'Subnetzmaske: ' + q.mask + '  (/' + q.p + ')',
                  'Im selben Netz? ' + blank, 'Netzadresse A: ' + blank + '   Netzadresse B: ' + blank],
          solution: [(q.same ? 'Ja' : 'Nein') + ' – Netz A: ' + q.na + ', Netz B: ' + q.nb] };
      }
    },
    'subnet-calc': {
      label: 'Subnetz analysieren (Netz, Broadcast, Hosts)', levels: LV, points: { L: 3, M: 4, S: 5 },
      gen(seed, lvl) {
        const T = SN.makeTask(seed, lvl, 'calc'); const a = T.ans;
        return { intro: 'Bestimme zur Adresse alle folgenden Angaben.',
          lines: ['Adresse: ' + T.ip + '/' + T.p, 'Netzadresse: ' + blank, 'Broadcast: ' + blank,
                  'Erster Host: ' + blank, 'Letzter Host: ' + blank,
                  'Anzahl nutzbarer Hosts: ' + blank, 'Subnetzmaske: ' + blank],
          solution: ['Netz ' + a.net + ', Broadcast ' + a.bc + ', Hosts ' + a.first + '–' + a.last +
                     ' (' + a.hosts + '), Maske ' + a.mask] };
      }
    },
    'subnet-equal': {
      label: 'Gleich große Subnetze bilden', levels: LV, points: { L: 3, M: 4, S: 5 },
      gen(seed, lvl) {
        const T = SN.makeTask(seed, lvl, 'equal'); const a = T.ans;
        return { intro: 'Teile das Ausgangsnetz in gleich große Subnetze.',
          lines: ['Ausgangsnetz: ' + T.base + '/' + T.bp, 'Benötigte Subnetze: mindestens ' + T.want,
                  'Neue Präfixlänge: ' + blank, 'Subnetzmaske: ' + blank, 'Anzahl Subnetze: ' + blank,
                  'Hosts je Subnetz: ' + blank, 'Netzadresse des ' + (T.idx + 1) + '. Subnetzes: ' + blank],
          solution: ['/' + a.p + ' (' + a.mask + '), ' + a.count + ' Subnetze, ' + a.hosts +
                     ' Hosts/Subnetz; ' + (T.idx + 1) + '. Subnetz: ' + a.net] };
      }
    },
    'subnet-super': {
      label: 'Supernetting (Netze zusammenfassen)', levels: LV, points: { L: 3, M: 4, S: 5 },
      gen(seed, lvl) {
        const T = SN.makeTask(seed, lvl, 'sup'); const a = T.ans;
        return { intro: 'Fasse die folgenden Netze zum kleinstmöglichen gemeinsamen Supernetz zusammen.',
          lines: T.nets.map(function (n) { return 'Netz: ' + n.net + '/' + n.p; })
            .concat(['Supernetz (Adresse / Präfix): ' + blank, 'Subnetzmaske: ' + blank]),
          solution: [a.net + '/' + a.p + '  (' + a.mask + ')'] };
      }
    },
    'dtp': {
      label: 'DTP-Aushandlung (Trunk / Access / Mismatch)', levels: LV, points: { L: 2, M: 3, S: 4 }, tag: 'VDP',
      gen(seed, lvl) {
        const T = VD.makeTask(seed, lvl);
        return { intro: 'Welcher Port-Modus ergibt sich aus der DTP-Aushandlung?',
          lines: ['Port: ' + T.port, 'SW1: switchport mode ' + T.m1, 'SW2: switchport mode ' + T.m2,
                  'Ergebnis (Trunk / Access / Mismatch): ' + blank, 'Begründung: ' + blank],
          solution: [T.res.outcome + ' – ' + T.res.why] };
      }
    },
    'etherchannel': {
      label: 'EtherChannel-Aushandlung (LACP/PAgP)', levels: LV, points: { L: 2, M: 3, S: 4 }, tag: 'ECH',
      gen(seed, lvl) {
        const T = EC.makeTask(seed, lvl); const r = T.res;
        return { intro: 'Bildet sich ein EtherChannel? Wenn ja, mit welchem Protokoll?',
          lines: ['Anzahl parallele Leitungen: ' + T.n, 'SW1: channel-group mode ' + T.m1,
                  'SW2: channel-group mode ' + T.m2, 'EtherChannel bildet sich? ' + blank, 'Protokoll: ' + blank],
          solution: [(r.formed ? 'Ja, ' + r.proto : 'Nein') + ' – ' + r.why] };
      }
    },
    'acl-wildcard': {
      label: 'Wildcardmaske berechnen', levels: LV, points: { L: 2, M: 3, S: 4 },
      gen(seed, lvl) {
        const w = ACL.makeTask(seed, lvl).wild;
        return { intro: 'Gib die Wildcardmaske an und bestimme den Adressbereich.',
          lines: ['Netz: ' + w.base + '/' + w.p, 'Wildcardmaske: ' + blank,
                  'Erste Adresse: ' + blank, 'Letzte Adresse: ' + blank],
          solution: ['Wildcard ' + w.wc + ', Bereich ' + w.first + ' – ' + w.last] };
      }
    },
    'hsrp': {
      label: 'FHRP (HSRP/VRRP/GLBP) – aktiver Router', levels: LV, points: { L: 2, M: 3, S: 4 }, tag: 'HSR',
      gen(seed, lvl) {
        const T = FH.makeTask(seed, lvl); const act = T.R[T.hist[0].active];
        const lines = ['Protokoll: ' + T.proto + ' (Gruppe ' + T.g + ')', 'Virtuelle IP: ' + T.vip];
        T.R.forEach(function (r) { lines.push(r.name + ': Priorität ' + r.prio + (r.pre ? ', preempt' : '')); });
        lines.push('Welcher Router ist aktiv? ' + blank, 'Virtuelle MAC: ' + blank);
        return { intro: 'Bestimme den aktiven Router (Priorität/Preempt) und die virtuelle MAC-Adresse.',
          lines: lines, solution: [act.name + ' ist aktiv; virtuelle MAC ' + T.mac] };
      }
    },
    'zahlensysteme': {
      label: 'Zahlensysteme umrechnen', levels: LV, points: { L: 2, M: 3, S: 4 }, tag: 'ZAH',
      gen(seed, lvl) {
        const items = ZS.makeTask(seed, lvl).items;
        return { intro: 'Rechne die Zahlen in das angegebene Zahlensystem um.',
          lines: items.map(function (it, i) { return LET[i] + ') ' + it.q + ' (' + BASENAME[it.from] + ') → ' + BASENAME[it.to] + ': ' + blank; }),
          solution: [items.map(function (it, i) { return LET[i] + ') ' + it.a; }).join('    ')] };
      }
    },
    'iproute': {
      label: 'Routing: welche Route wird installiert? (show ip route)', levels: LV, points: { L: 3, M: 4, S: 5 }, tag: 'RTB',
      gen(seed, lvl) {
        const T = IR.makeTask(seed, lvl);
        const lines = ['Router ' + T.router + ' lernt folgende Netze. Welche Route kommt je Ziel in die Tabelle?',
          'Admin-Distanz: verbunden 0, EIGRP 90, OSPF 110, RIP 120 – bei gleicher Quelle kleinere Metrik.'];
        T.nets.forEach(function (n) {
          lines.push(n.net + '/' + n.p + ':  ' + n.offers.map(function (o) {
            return o.proto + (o.nh ? ' via ' + o.nh : '') + ' (Metrik ' + o.metric + ')'; }).join('   |   ') + '  → ' + blank);
        });
        return { intro: '', lines: lines,
          solution: [T.nets.map(function (n) {
            return n.net + '/' + n.p + ' → ' + n.win.proto + (n.win.nh ? ' via ' + n.win.nh : ' (direkt verbunden)'); }).join('   ·   ')] };
      }
    }
  };
}
module.exports = { build };
