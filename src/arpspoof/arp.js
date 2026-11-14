/* NWT · Netzwerksicherheit: ARP-Spoofing. ARP-Cache-Modell, Wireshark-Mitschnitt, Aufgaben-Generator.
   Browser: window.AR · Node: globalThis.AR */
(function (G) {
'use strict';
var LVNAME = {L: 'Leicht', M: 'Mittel', S: 'Schwer'};
var LVCODE = {L: 3, M: 4, S: 5};
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function ri(r, a, b) { return a + Math.floor(r() * (b - a + 1)); }
function pick(r, a) { return a[Math.floor(r() * a.length)]; }
function hex(r, n) { var s = ''; for (var i = 0; i < n; i++) s += '0123456789abcdef'[Math.floor(r() * 16)]; return s; }
function mac(r) { return pick(r, ['08:00:27', '00:0c:29', '52:54:00', '00:50:56', 'b8:27:eb', '2c:30:33', 'fc:ec:da', 'd8:3a:dd']) + ':' + hex(r, 2) + ':' + hex(r, 2) + ':' + hex(r, 2); }

/* ---------- Modell ----------
   Opfer, Gateway, Angreifer je {ip, mac}. Bei poisoning schickt der Angreifer gefälschte ARP-Replies:
   an das Opfer: "<Gateway-IP> is at <Angreifer-MAC>", an das Gateway: "<Opfer-IP> is at <Angreifer-MAC>".
   defense: 'none' | 'dai' (Dynamic ARP Inspection, verwirft gefälschte ARP an untrusted Port)
            | 'static' (Opfer hat statischen ARP-Eintrag fürs Gateway).
   Ergebnis: welche MAC steht beim Opfer fürs Gateway im Cache, ob MITM. */
function evaluate(s) {
  var blocked = s.poisoning && (s.defense === 'dai' || s.defense === 'static');
  var gwMacAtVictim = (s.poisoning && !blocked) ? s.attacker.mac : s.gateway.mac;
  var mitm = s.poisoning && !blocked;
  return {poisoned: s.poisoning && !blocked, blocked: blocked, gwMacAtVictim: gwMacAtVictim, mitm: mitm,
    protected: !s.poisoning || blocked, defenseKind: s.defense};
}

/* ARP-Tabelle des Opfers (arp -a) */
function arpTable(s) {
  var e = evaluate(s), rows = [
    {ip: s.gateway.ip, mac: e.gwMacAtVictim, note: e.poisoned ? 'rogue' : 'ok'},
    {ip: s.attacker.ip, mac: s.attacker.mac, note: 'ok'}
  ];
  if (s.extraHost) rows.push({ip: s.extraHost.ip, mac: s.extraHost.mac, note: 'ok'});
  rows.sort(function (a, b) { return parseInt(a.ip.split('.')[3]) - parseInt(b.ip.split('.')[3]); });
  return rows;
}

/* Wireshark-Mitschnitt: normale ARP-Auflösung + gefälschte Replies */
function capture(r, s) {
  var e = evaluate(s), rows = [], t = 0, no = 1;
  function add(src, dst, info, tag) { rows.push({no: no++, t: (t += 0.03 + r() * 0.2).toFixed(4), src: src, dst: dst, proto: 'ARP', info: info, tag: tag || ''}); }
  add(s.victim.mac, 'Broadcast', 'Who has ' + s.gateway.ip + '? Tell ' + s.victim.ip, '');
  add(s.gateway.mac, s.victim.mac, s.gateway.ip + ' is at ' + s.gateway.mac, 'real');
  if (s.poisoning) {
    var n = e.blocked ? 1 : 3;
    for (var i = 0; i < n; i++) {
      add(s.attacker.mac, s.victim.mac, s.gateway.ip + ' is at ' + s.attacker.mac + (e.blocked ? '  [von DAI verworfen]' : ''), e.blocked ? 'drop' : 'rogue');
      if (!e.blocked) add(s.attacker.mac, s.gateway.mac, s.victim.ip + ' is at ' + s.attacker.mac, 'rogue');
    }
  }
  return rows;
}

/* ---------- Generator ---------- */
function build(r, lvl) {
  var n = ri(r, 1, 60), net = '192.168.' + n + '.';
  var victim = {ip: net + ri(r, 40, 99), mac: mac(r)}, gateway = {ip: net + '1', mac: mac(r)}, attacker = {ip: net + ri(r, 100, 199), mac: mac(r)};
  var poisoning = lvl === 'L' ? pick(r, [true, true, false]) : pick(r, [true, true, true, false]);
  var defense = !poisoning ? 'none' : lvl === 'L' ? pick(r, ['none', 'none', 'dai']) : lvl === 'M' ? pick(r, ['none', 'dai', 'static']) : pick(r, ['none', 'dai', 'static', 'dai']);
  var s = {net: net, victim: victim, gateway: gateway, attacker: attacker, poisoning: poisoning, defense: defense,
    extraHost: lvl !== 'L' && r() < 0.5 ? {ip: net + ri(r, 20, 39), mac: mac(r)} : null};
  s.res = evaluate(s);
  return s;
}
function makeTask(seed, lvl) {
  if (!LVCODE[lvl] || !(seed >= 1)) return null;
  var r = mulberry32((seed * 7919 + LVCODE[lvl] * 1000003 + 6421) >>> 0);
  var s = build(r, lvl);
  s.level = lvl; s.code = lvl + '-' + seed;
  return s;
}

G.AR = {LVNAME: LVNAME, evaluate: evaluate, arpTable: arpTable, capture: capture, makeTask: makeTask, mulberry32: mulberry32, mac: mac};
})(typeof window !== 'undefined' ? window : globalThis);
