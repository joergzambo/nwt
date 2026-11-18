/* NWT · Switching: VTP und DTP. DTP-Aushandlung (Trunk/Access/Mismatch), VTP-Revisionsmodell, Aufgaben-Generator.
   Browser: window.VD · Node: globalThis.VD */
(function (G) {
'use strict';
var LVNAME = {L: 'Leicht', M: 'Mittel', S: 'Schwer'};
var LVCODE = {L: 3, M: 4, S: 5};
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function ri(r,a,b){return a+Math.floor(r()*(b-a+1));}
function pick(r,a){return a[Math.floor(r()*a.length)];}

/* ---------- DTP-Modell ----------
   Modi: 'access', 'trunk', 'auto' (dynamic auto), 'desirable' (dynamic desirable),
         'trunk-noneg' (trunk + switchport nonegotiate), 'access-noneg'.
   Jede Seite erreicht eine Betriebsart 'trunk' oder 'access'; stimmen beide nicht überein → Mismatch. */
var LABEL = {access: 'access', trunk: 'trunk', auto: 'dynamic auto', desirable: 'dynamic desirable', 'trunk-noneg': 'trunk + nonegotiate', 'access-noneg': 'access + nonegotiate'};
function isAccess(m){return m === 'access' || m === 'access-noneg';}
function isTrunk(m){return m === 'trunk' || m === 'trunk-noneg';}
function sendsDTP(m){return m !== 'trunk-noneg' && m !== 'access-noneg';}

/* Betriebsart, die "self" gegenüber "peer" annimmt */
function opMode(self, peer) {
  if (isAccess(self)) return 'access';
  if (isTrunk(self)) return 'trunk';
  if (self === 'auto') {
    // nur Trunk, wenn der Nachbar aktiv auffordert (desirable/trunk) UND DTP sendet
    return (sendsDTP(peer) && (peer === 'desirable' || isTrunk(peer))) ? 'trunk' : 'access';
  }
  // desirable: will aktiv trunken
  if (isAccess(peer)) return 'access';
  if (!sendsDTP(peer)) return 'access';           // Nachbar schweigt (nonegotiate) → keine Bestätigung
  return (isTrunk(peer) || peer === 'desirable' || peer === 'auto') ? 'trunk' : 'access';
}
function negotiate(a, b) {
  var oa = opMode(a, b), ob = opMode(b, a);
  var outcome = oa === ob ? oa : 'mismatch';
  var why;
  if (outcome === 'trunk') why = 'Beide Seiten werden Trunk – mindestens eine Seite fordert aktiv auf (trunk/desirable), die andere macht mit.';
  else if (outcome === 'access') {
    if (a === 'auto' && b === 'auto') why = 'Beide stehen auf dynamic auto und warten nur – niemand fängt an, also bleibt es Access.';
    else if (isAccess(a) && isAccess(b)) why = 'Beide Ports sind fest Access – kein Trunk.';
    else why = 'Eine Seite trunkt nicht (Access), die andere fällt auf Access zurück – kein Trunk.';
  } else {
    why = 'Mismatch: ' + (oa === 'trunk' ? 'SW1' : 'SW2') + ' ist Trunk, ' + (oa === 'trunk' ? 'SW2' : 'SW1') + ' ist Access. '
      + (!sendsDTP(a) || !sendsDTP(b) ? 'Durch nonegotiate kommen keine DTP-Frames an, die Gegenseite bleibt Access.' : 'Ein fest getrunkter Port trifft auf einen Access-Port.');
  }
  return {a: oa, b: ob, outcome: outcome, why: why};
}

/* ---------- VTP-Modell (für die Revisions-Demo) ----------
   Höhere Revision gewinnt; Server/Client übernehmen die VLAN-Liste mit der höchsten Revision im selben Domain. */
function vtpSync(switches) {
  // switches: [{name, mode:'server'|'client'|'transparent', rev, vlans:[...]}]
  var inDomain = switches.filter(function (s) { return s.mode !== 'transparent'; });
  var best = null;
  inDomain.forEach(function (s) { if (!best || s.rev > best.rev) best = s; });
  return inDomain.map(function (s) { return {name: s.name, mode: s.mode, rev: best ? best.rev : s.rev, vlans: best ? best.vlans.slice() : s.vlans.slice(), overwritten: best && s !== best && JSON.stringify(s.vlans) !== JSON.stringify(best.vlans)}; });
}

/* ---------- Generator (DTP) ---------- */
var BASE = ['access', 'trunk', 'auto', 'desirable'];
function build(r, lvl) {
  var pool = lvl === 'L' ? ['trunk', 'auto', 'desirable'] : lvl === 'M' ? BASE : BASE.concat(['trunk-noneg', 'trunk-noneg', 'access-noneg']);
  var m1 = pick(r, pool), m2 = pick(r, pool);
  if (lvl === 'L') { // klar trunkbare oder klar nicht – aber kein auto+auto-Spezialfall
    if (m1 === 'auto' && m2 === 'auto') m2 = 'desirable';
  }
  if (lvl === 'S' && !/noneg/.test(m1) && !/noneg/.test(m2)) m1 = pick(r, ['trunk-noneg', 'access-noneg']); // mind. ein Sonderfall
  var t = {m1: m1, m2: m2, port: 'Gi0/' + ri(r, 1, 3), dom: pick(r, ['CAMPUS', 'HTL', 'LAB', 'CORE'])};
  t.res = negotiate(m1, m2);
  return t;
}
function cfgLines(m) {
  var L = [];
  if (isAccess(m)) L.push('switchport mode access');
  else if (isTrunk(m)) L.push('switchport mode trunk');
  else L.push('switchport mode dynamic ' + m);
  if (/noneg/.test(m)) L.push('switchport nonegotiate');
  return L;
}
function config(t, side) {
  var m = side === 's1' ? t.m1 : t.m2;
  return 'interface ' + t.port + '\n ' + cfgLines(m).join('\n ');
}
function makeTask(seed, lvl) {
  if (!LVCODE[lvl] || !(seed >= 1)) return null;
  var r = mulberry32((seed * 7919 + LVCODE[lvl] * 1000003 + 6101) >>> 0), t = build(r, lvl);
  t.level = lvl; t.code = lvl + '-' + seed;
  return t;
}

G.VD = {LVNAME: LVNAME, LABEL: LABEL, opMode: opMode, negotiate: negotiate, vtpSync: vtpSync, config: config, cfgLines: cfgLines, makeTask: makeTask, mulberry32: mulberry32, BASE: BASE};
})(typeof window !== 'undefined' ? window : globalThis);
