/* Themen-Registry: nutzt die vorhandenen Generatoren aus ../src wieder.
   Jedes Thema erzeugt aus einem Seed ein Beispiel {lines, solution, points}.
   Zwei komplementäre Gruppen = dasselbe Thema, gleiche Schwierigkeit, zwei Seeds. */
const path = require('path');
const SRC = path.resolve(__dirname, '..', 'src');
require(path.join(SRC, 'netz', 'netz.js'));
require(path.join(SRC, 'subnet', 'sub.js'));
require(path.join(SRC, 'vtpdtp', 'dtp.js'));
const NA = globalThis.NA, SN = globalThis.SN, VD = globalThis.VD;

const LV = ['L', 'M', 'S'];
const LVNAME = { L: 'Leicht', M: 'Mittel', S: 'Schwer' };
const blank = '____________';

const TOPICS = {
  'netz-adresse': {
    label: 'Netzadresse & Broadcast berechnen', levels: LV, points: { L: 2, M: 3, S: 4 },
    gen(seed, lvl) {
      const d = NA.makeTask(seed, lvl).d;
      return {
        intro: 'Bestimme Netzadresse und Broadcast-Adresse.',
        lines: ['Host-IP: ' + d.ip, 'Subnetzmaske: ' + d.mask + '  (/' + d.p + ')',
                'Netzadresse: ' + blank, 'Broadcast-Adresse: ' + blank],
        solution: ['Netzadresse: ' + d.net, 'Broadcast: ' + d.bc]
      };
    }
  },
  'netz-gleich': {
    label: 'Sind zwei Geräte im selben Netz?', levels: LV, points: { L: 2, M: 3, S: 4 },
    gen(seed, lvl) {
      const q = NA.makeTask(seed, lvl).q;
      return {
        intro: 'Liegen die beiden Geräte im selben Netz? Begründe mit den Netzadressen.',
        lines: ['Gerät A: ' + q.a, 'Gerät B: ' + q.b, 'Subnetzmaske: ' + q.mask + '  (/' + q.p + ')',
                'Im selben Netz? ' + blank, 'Netzadresse A: ' + blank + '   Netzadresse B: ' + blank],
        solution: [(q.same ? 'Ja' : 'Nein') + ' – Netz A: ' + q.na + ', Netz B: ' + q.nb]
      };
    }
  },
  'subnet-calc': {
    label: 'Subnetz analysieren (Netz, Broadcast, Hosts)', levels: LV, points: { L: 3, M: 4, S: 5 },
    gen(seed, lvl) {
      const T = SN.makeTask(seed, lvl, 'calc'); const a = T.ans;
      return {
        intro: 'Bestimme zur Adresse alle folgenden Angaben.',
        lines: ['Adresse: ' + T.ip + '/' + T.p, 'Netzadresse: ' + blank, 'Broadcast: ' + blank,
                'Erster Host: ' + blank, 'Letzter Host: ' + blank,
                'Anzahl nutzbarer Hosts: ' + blank, 'Subnetzmaske: ' + blank],
        solution: ['Netz ' + a.net + ', Broadcast ' + a.bc + ', Hosts ' + a.first + '–' + a.last +
                   ' (' + a.hosts + '), Maske ' + a.mask]
      };
    }
  },
  'subnet-equal': {
    label: 'Gleich große Subnetze bilden', levels: LV, points: { L: 3, M: 4, S: 5 },
    gen(seed, lvl) {
      const T = SN.makeTask(seed, lvl, 'equal'); const a = T.ans;
      return {
        intro: 'Teile das Ausgangsnetz in gleich große Subnetze.',
        lines: ['Ausgangsnetz: ' + T.base + '/' + T.bp, 'Benötigte Subnetze: mindestens ' + T.want,
                'Neue Präfixlänge: ' + blank, 'Subnetzmaske: ' + blank, 'Anzahl Subnetze: ' + blank,
                'Hosts je Subnetz: ' + blank, 'Netzadresse des ' + (T.idx + 1) + '. Subnetzes: ' + blank],
        solution: ['/' + a.p + ' (' + a.mask + '), ' + a.count + ' Subnetze, ' + a.hosts +
                   ' Hosts/Subnetz; ' + (T.idx + 1) + '. Subnetz: ' + a.net]
      };
    }
  },
  'dtp': {
    label: 'DTP-Aushandlung (Trunk / Access / Mismatch)', levels: LV, points: { L: 2, M: 3, S: 4 },
    gen(seed, lvl) {
      const T = VD.makeTask(seed, lvl);
      return {
        intro: 'Welcher Port-Modus ergibt sich aus der DTP-Aushandlung?',
        lines: ['Port: ' + T.port, 'SW1: switchport mode ' + T.m1, 'SW2: switchport mode ' + T.m2,
                'Ergebnis (Trunk / Access / Mismatch): ' + blank, 'Begründung: ' + blank],
        solution: [T.res.outcome + ' – ' + T.res.why]
      };
    }
  }
};

/* Erzeugt N komplementäre Beispielpaare: Gruppe 1 Seeds s, Gruppe 2 Seeds s+offset.
   Gleiche Themenmischung/Schwierigkeit, andere Zahlen. */
function buildGroups(topicId, levels, count, seedBase) {
  const t = TOPICS[topicId];
  if (!t) throw new Error('Unbekanntes Thema: ' + topicId);
  seedBase = seedBase || Math.floor(Math.random() * 90000) + 1000;
  const OFF = 50000; // großer Versatz -> garantiert andere Beispiele in Gruppe 2
  const g1 = [], g2 = [], sol1 = [], sol2 = [];
  for (let i = 0; i < count; i++) {
    const lvl = levels[i % levels.length];
    const e1 = t.gen(seedBase + i, lvl), e2 = t.gen(seedBase + OFF + i, lvl);
    const pts = t.points[lvl];
    g1.push({ intro: e1.intro, lines: e1.lines, points: pts });
    g2.push({ intro: e2.intro, lines: e2.lines, points: pts });
    sol1.push('A' + (i + 1) + ' (' + LVNAME[lvl] + '): ' + e1.solution.join(' | '));
    sol2.push('A' + (i + 1) + ' (' + LVNAME[lvl] + '): ' + e2.solution.join(' | '));
  }
  return {
    groups: [{ examples: g1 }, { examples: g2 }],
    solutions: [{ title: 'Gruppe 1', lines: sol1 }, { title: 'Gruppe 2', lines: sol2 }],
    seedBase
  };
}

module.exports = { TOPICS, buildGroups, LVNAME };
