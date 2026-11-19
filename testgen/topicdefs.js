/* Themen-Definitionen (nachladbar per Auto-Abgleich).
   build(E) bekommt die Generatoren E = {NA, SN, VD} und liefert die Themen-Map.
   Beim Ergänzen neuer Themen: hier einen Eintrag hinzufügen, zugehörigen
   Generator in engines/ ablegen, sync-manifest.json Version erhöhen. */
function build(E) {
  const NA = E.NA, SN = E.SN, VD = E.VD;
  const LV = ['L', 'M', 'S'];
  const blank = '____________';
  return {
    'netz-adresse': {
      label: 'Netzadresse & Broadcast berechnen', levels: LV, points: { L: 2, M: 3, S: 4 },
      gen(seed, lvl) {
        const d = NA.makeTask(seed, lvl).d;
        return { intro: 'Bestimme Netzadresse und Broadcast-Adresse.',
          lines: ['Host-IP: ' + d.ip, 'Subnetzmaske: ' + d.mask + '  (/' + d.p + ')',
                  'Netzadresse: ' + blank, 'Broadcast-Adresse: ' + blank],
          solution: ['Netzadresse: ' + d.net, 'Broadcast: ' + d.bc] };
      }
    },
    'netz-gleich': {
      label: 'Sind zwei Geräte im selben Netz?', levels: LV, points: { L: 2, M: 3, S: 4 },
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
    'dtp': {
      label: 'DTP-Aushandlung (Trunk / Access / Mismatch)', levels: LV, points: { L: 2, M: 3, S: 4 },
      gen(seed, lvl) {
        const T = VD.makeTask(seed, lvl);
        return { intro: 'Welcher Port-Modus ergibt sich aus der DTP-Aushandlung?',
          lines: ['Port: ' + T.port, 'SW1: switchport mode ' + T.m1, 'SW2: switchport mode ' + T.m2,
                  'Ergebnis (Trunk / Access / Mismatch): ' + blank, 'Begründung: ' + blank],
          solution: [T.res.outcome + ' – ' + T.res.why] };
      }
    }
  };
}
module.exports = { build };
