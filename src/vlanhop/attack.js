/* NWT · Netzwerksicherheit: VTP-Hijacking und VLAN-Hopping mit Yersinia.
   Switch-Spoofing über DTP + Überschreiben der VLAN-DB über VTP. Aufgaben-Generator.
   Browser: window.VH · Node: globalThis.VH */
(function (G) {
'use strict';
var LVNAME = {L: 'Leicht', M: 'Mittel', S: 'Schwer'};
var LVCODE = {L: 3, M: 4, S: 5};
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function ri(r,a,b){return a+Math.floor(r()*(b-a+1));}
function pick(r,a){return a[Math.floor(r()*a.length)];}

/* ---- DTP (wie in der VTP/DTP-Einheit) ---- */
var LABEL = {access: 'access', trunk: 'trunk', auto: 'dynamic auto', desirable: 'dynamic desirable', 'trunk-noneg': 'trunk + nonegotiate', 'access-noneg': 'access + nonegotiate'};
function isAccess(m){return m === 'access' || m === 'access-noneg';}
function isTrunk(m){return m === 'trunk' || m === 'trunk-noneg';}
function sendsDTP(m){return m !== 'trunk-noneg' && m !== 'access-noneg';}
function opMode(self, peer) {
  if (isAccess(self)) return 'access';
  if (isTrunk(self)) return 'trunk';
  if (self === 'auto') return (sendsDTP(peer) && (peer === 'desirable' || isTrunk(peer))) ? 'trunk' : 'access';
  if (isAccess(peer)) return 'access';
  if (!sendsDTP(peer)) return 'access';
  return (isTrunk(peer) || peer === 'desirable' || peer === 'auto') ? 'trunk' : 'access';
}
/* Angreifer (Yersinia) sendet DTP „desirable" und liest/injiziert rohe Frames.
   Entscheidend ist, ob der SWITCH-PORT betrieblich zum Trunk wird – dann sieht
   der Angreifer alle VLANs und kann VTP einspeisen. Ein fest getrunkter Port
   (auch mit nonegotiate) liefert die VLANs sogar ohne Aushandlung. */
function spoofs(portMode) {
  return opMode(portMode, 'desirable') === 'trunk';
}

/* ---- VTP-Hijacking ----
   Der Angreifer kann die VLAN-DB nur überschreiben, wenn:
   - ein Trunk zustande kommt (Switch-Spoofing), UND
   - der Switch an der Domäne teilnimmt (Server oder Client), UND
   - kein VTP-Passwort gesetzt ist (sonst bräuchte er den MD5-Hash). */
function analyze(t) {
  var trunk = spoofs(t.portMode);
  var participates = t.vtpMode === 'server' || t.vtpMode === 'client';
  var hijack = trunk && participates && !t.vtpPass;
  var why;
  if (!trunk) why = 'Kein Trunk: Der Port bleibt Access (' + LABEL[t.portMode] + '), der Angreifer sieht nur sein eigenes VLAN – und VTP läuft nur über Trunks.';
  else if (!participates) why = 'Trunk steht, aber der Switch ist VTP ' + t.vtpMode + ' – er übernimmt keine fremde Datenbank, die VLANs bleiben.';
  else if (t.vtpPass) why = 'Trunk steht und der Switch nimmt an VTP teil, aber es ist ein VTP-Passwort gesetzt – ohne das Passwort wird die gefälschte Ankündigung verworfen.';
  else why = 'Trunk steht, Switch ist VTP ' + t.vtpMode + ' ohne Passwort: Die gefälschte Ankündigung mit höherer Revision überschreibt die VLAN-Datenbank.';
  return {trunk: trunk, participates: participates, hijack: hijack, why: why};
}

/* ---- Generator ---- */
function build(r, lvl) {
  var modes = lvl === 'L' ? ['auto', 'desirable', 'access'] : lvl === 'M' ? ['auto', 'desirable', 'access', 'access-noneg'] : ['auto', 'desirable', 'access', 'access-noneg', 'trunk-noneg'];
  var portMode = pick(r, modes);
  var vtpMode = lvl === 'L' ? pick(r, ['server', 'server', 'client']) : pick(r, ['server', 'client', 'transparent', 'off']);
  var vtpPass = lvl === 'L' ? false : r() < (lvl === 'S' ? 0.45 : 0.3);
  var t = {portMode: portMode, vtpMode: vtpMode, vtpPass: vtpPass, port: 'Gi0/' + ri(r, 2, 12), dom: pick(r, ['CAMPUS', 'HTL', 'LAB', 'CORE', 'SCHULE']), rev: ri(r, 3, 20)};
  t.res = analyze(t);
  return t;
}
function portCfg(t) {
  var m = t.portMode, L = ['interface ' + t.port];
  if (isAccess(m)) L.push(' switchport mode access');
  else if (isTrunk(m)) L.push(' switchport mode trunk');
  else L.push(' switchport mode dynamic ' + m);
  if (/noneg/.test(m)) L.push(' switchport nonegotiate');
  return L.join('\n');
}
function vtpCfg(t) {
  var L = ['vtp domain ' + t.dom, 'vtp mode ' + t.vtpMode];
  if (t.vtpPass) L.push('vtp password ********');
  return L.join('\n');
}
function makeTask(seed, lvl) {
  if (!LVCODE[lvl] || !(seed >= 1)) return null;
  var r = mulberry32((seed * 7919 + LVCODE[lvl] * 1000003 + 7307) >>> 0), t = build(r, lvl);
  t.level = lvl; t.code = lvl + '-' + seed;
  return t;
}

G.VH = {LVNAME: LVNAME, LABEL: LABEL, opMode: opMode, spoofs: spoofs, analyze: analyze, portCfg: portCfg, vtpCfg: vtpCfg, makeTask: makeTask, mulberry32: mulberry32};
})(typeof window !== 'undefined' ? window : globalThis);
