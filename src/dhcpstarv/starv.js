/* NWT · Netzwerksicherheit: DHCP-Starvation. Pool-Modell, gefälschte MACs, Wireshark-Mitschnitt, Aufgaben-Generator.
   Browser: window.DS · Node: globalThis.DS */
(function (G) {
'use strict';
var LVNAME = {L: 'Leicht', M: 'Mittel', S: 'Schwer'};
var LVCODE = {L: 3, M: 4, S: 5};
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function ri(r, a, b) { return a + Math.floor(r() * (b - a + 1)); }
function pick(r, a) { return a[Math.floor(r() * a.length)]; }
function hex(r, n) { var s = ''; for (var i = 0; i < n; i++) s += '0123456789abcdef'[Math.floor(r() * 16)]; return s; }
function mac(r) { var o = []; for (var i = 0; i < 6; i++) o.push(hex(r, 2)); return o.join(':'); }
function oui(r) { return pick(r, ['08:00:27', '00:0c:29', '52:54:00', '00:50:56', 'b8:27:eb', '00:1a:2b']) + ':' + hex(r, 2) + ':' + hex(r, 2) + ':' + hex(r, 2); }

/* ---------- Angriffsmodell ----------
   Pool: start..end im /24. Angreifer sendet `flood` DISCOVERs.
   mode: 'both' = Quell-MAC und chaddr zufällig (Yersinia-Standard); 'chaddr' = nur chaddr zufällig, eine Quell-MAC.
   Abwehr: portSec = max. MACs am Angreifer-Port (0 = aus); verify = ip dhcp snooping verify mac-address;
           snoopTrust = Angreifer-Port ist untrusted bei aktivem DHCP Snooping (blockt nur Server-Antworten, nicht DISCOVER).
   Ergebnis: wie viele Leases der Angreifer bekommt, ob der Pool leer ist, welche Abwehr gegriffen hat. */
function simulate(s) {
  var poolSize = s.poolEnd - s.poolStart + 1, got, reason, effective = null;
  if (s.portSec > 0 && s.mode === 'both') {
    /* Jede neue Quell-MAC zählt; nach portSec MACs greift die Port-Security */
    got = Math.min(s.flood, s.portSec, poolSize - s.legit);
    if (s.flood > s.portSec) { reason = 'Port-Security lässt nur ' + s.portSec + ' MAC-Adressen zu, dann ' + (s.psAction === 'shutdown' ? 'err-disabled' : 'verworfen') + '.'; effective = 'portsec'; }
    else reason = 'Angriff passt unter das Port-Security-Limit.';
  } else if (s.verify && s.mode === 'both') {
    /* verify prüft Quell-MAC == chaddr. Bei 'both' sind beide gleich gefälscht -> verify greift NICHT */
    got = Math.min(s.flood, poolSize - s.legit); reason = 'verify mac-address greift nicht: Quell-MAC und chaddr sind identisch gefälscht.';
  } else if (s.verify && s.mode === 'chaddr') {
    got = 0; reason = 'verify mac-address verwirft alle: Quell-MAC bleibt gleich, chaddr ändert sich – Mismatch.'; effective = 'verify';
  } else if (s.portSec > 0 && s.mode === 'chaddr') {
    /* Nur eine Quell-MAC -> Port-Security sieht nur 1 MAC, greift nicht */
    got = Math.min(s.flood, poolSize - s.legit); reason = 'Port-Security greift nicht: nur eine Quell-MAC, aber viele chaddr.';
  } else {
    got = Math.min(s.flood, poolSize - s.legit); reason = 'Keine wirksame Abwehr – der Pool wird geleert.';
  }
  var free = poolSize - s.legit - got, exhausted = free <= 0;
  return {poolSize: poolSize, leased: s.legit + got, attackerGot: got, free: Math.max(0, free), exhausted: exhausted, reason: reason, effective: effective};
}

/* ---------- Wireshark-Mitschnitt ----------
   Erzeugt eine Paketliste: legitime DORA + Flood aus gefälschten DISCOVERs. */
function capture(r, s, n) {
  var rows = [], t = 0, no = 1, bc = 'ff:ff:ff:ff:ff:ff';
  function add(src, dst, info, bad) { rows.push({no: no++, t: (t += 0.0003 + r() * 0.002).toFixed(4), src: src, dst: dst, proto: 'DHCP', info: info, bad: !!bad}); }
  if (s.showLegit) {
    var cm = oui(r), xid = '0x' + hex(r, 8);
    add(cm, bc, 'DHCP Discover - Transaction ID ' + xid);
    add(s.serverMac, bc, 'DHCP Offer    - Transaction ID ' + xid);
    add(cm, bc, 'DHCP Request  - Transaction ID ' + xid);
    add(s.serverMac, bc, 'DHCP ACK      - Transaction ID ' + xid);
  }
  var fl = Math.min(n || s.flood, 120);
  for (var i = 0; i < fl; i++) {
    var src = s.mode === 'both' ? mac(r) : s.attackerMac, ch = mac(r);
    add(src, bc, 'DHCP Discover - Transaction ID 0x' + hex(r, 8) + (s.showChaddr ? '  (chaddr ' + ch + ')' : ''), true);
  }
  return rows;
}

/* ---------- Generator ---------- */
function build(r, lvl) {
  var start = pick(r, [10, 20, 50, 100]), size = pick(r, lvl === 'L' ? [20, 30, 50] : [30, 50, 100, 150]);
  var legit = ri(r, 1, Math.min(8, Math.floor(size / 4)));
  var mode = lvl === 'L' ? 'both' : pick(r, ['both', 'both', 'chaddr']);
  var defenses = lvl === 'L' ? pick(r, [[], ['portsec']]) : lvl === 'M' ? pick(r, [[], ['portsec'], ['verify'], ['snoop']]) : pick(r, [['portsec'], ['verify'], ['portsec', 'snoop'], ['verify', 'snoop'], []]);
  var portSec = defenses.indexOf('portsec') >= 0 ? pick(r, [1, 2, 3, 5]) : 0;
  var s = {
    net: '192.168.' + ri(r, 1, 50) + '.', poolStart: start, poolEnd: start + size - 1, legit: legit,
    flood: pick(r, [size + ri(r, 5, 40), ri(r, 2, size - legit - 1), size * 2]), mode: mode,
    portSec: portSec, psAction: pick(r, ['shutdown', 'restrict']), verify: defenses.indexOf('verify') >= 0,
    snoop: defenses.indexOf('snoop') >= 0, serverMac: oui(r), attackerMac: oui(r),
    showLegit: true, showChaddr: lvl !== 'L'
  };
  s.res = simulate(s);
  /* Für eindeutige Übungen: Flood soll den Pool ohne Abwehr leeren können, außer wenn absichtlich klein */
  s.canExhaust = s.flood >= s.poolEnd - s.poolStart + 1 - s.legit;
  return s;
}
function makeTask(seed, lvl) {
  if (!LVCODE[lvl] || !(seed >= 1)) return null;
  for (var att = 0; att < 60; att++) {
    var r = mulberry32((seed * 7919 + att * 104729 + LVCODE[lvl] * 1000003 + 4231) >>> 0);
    var s = build(r, lvl);
    s.level = lvl; s.code = lvl + '-' + seed;
    return s;
  }
  return null;
}
function fmtMac(m) { return m; }

G.DS = {LVNAME: LVNAME, simulate: simulate, capture: capture, makeTask: makeTask, mulberry32: mulberry32, mac: mac, oui: oui, hex: hex};
})(typeof window !== 'undefined' ? window : globalThis);
