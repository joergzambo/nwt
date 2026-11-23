/* Troubleshooting: kaputte Links diagnostizieren anhand von show-Ausgaben.
   Browser: window.TS · Node: globalThis.TS  */
(function (G) {
  var LVNAME = { L: 'Leicht', M: 'Mittel', S: 'Schwer' };
  var LVCODE = { L: 3, M: 4, S: 5 };
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function ri(r, n) { return Math.floor(r() * n); }
  function pick(r, a) { return a[ri(r, a.length)]; }

  /* Ursachen (Auswahlliste) */
  var CAUSES = [
    { id: 'admin', txt: 'Interface administrativ abgeschaltet (no shutdown fehlt)' },
    { id: 'cable', txt: 'Physikalisches Problem – Kabel/Port (down/down)' },
    { id: 'duplex', txt: 'Duplex-Mismatch (Kollisionen/CRC-Fehler)' },
    { id: 'vlan', txt: 'Access-Port im falschen VLAN' },
    { id: 'ip', txt: 'Falsche/fehlende IP (falsches Subnetz)' }
  ];
  /* passende Fixes (Auswahlliste) */
  var FIXES = [
    { id: 'noshut', txt: 'no shutdown' },
    { id: 'cable', txt: 'Kabel/Port prüfen und anstecken' },
    { id: 'duplex', txt: 'duplex full (auf beiden Seiten gleich)' },
    { id: 'vlan', txt: 'switchport access vlan <richtig>' },
    { id: 'ip', txt: 'ip address <richtig> <Maske>' }
  ];
  var MAP = { admin: 'noshut', cable: 'cable', duplex: 'duplex', vlan: 'vlan', ip: 'ip' };

  function iface(r) { return pick(r, ['GigabitEthernet0/0', 'GigabitEthernet0/1', 'FastEthernet0/0']); }
  function shortIf(n) { return n.replace('GigabitEthernet', 'Gi').replace('FastEthernet', 'Fa'); }

  function build(r, lvl) {
    var faults = lvl === 'L' ? ['admin', 'cable'] : lvl === 'M' ? ['admin', 'cable', 'duplex', 'ip'] : ['admin', 'cable', 'duplex', 'ip', 'vlan'];
    var fault = pick(r, faults);
    var dev = pick(r, ['R1', 'R2', 'SW1', 'CORE']);
    var ifn = iface(r), sif = shortIf(ifn);
    var net = '10.' + (1 + ri(r, 60)) + '.' + ri(r, 60) + '.';
    var ip = net + '1', peerIp = net + '2', mask = '255.255.255.0';
    var status = 'up', proto = 'up', symptom = 'Ping von ' + dev + ' zu ' + peerIp + ' schlägt fehl.';

    var shrun = ['interface ' + ifn];
    var shintTail = ' Full-duplex, 1000Mb/s\n  0 runts, 0 giants, 0 CRC, 0 collisions, 0 late collision';
    var ipLine = ' ip address ' + ip + ' ' + mask;

    if (fault === 'admin') { status = 'administratively down'; proto = 'down'; shrun.push(ipLine); shrun.push(' shutdown'); }
    else if (fault === 'cable') { status = 'down'; proto = 'down'; shrun.push(ipLine); }
    else if (fault === 'duplex') { shrun.push(ipLine); shintTail = ' Half-duplex, 100Mb/s\n  0 runts, 371 giants, 2145 CRC, 0 collisions, 1894 late collision'; }
    else if (fault === 'ip') { ip = '10.' + (80 + ri(r, 10)) + '.9.1'; ipLine = ' ip address ' + ip + ' ' + mask; shrun.push(ipLine); }
    else if (fault === 'vlan') { status = 'up'; proto = 'up'; shrun = ['interface ' + ifn, ' switchport mode access', ' switchport access vlan ' + (30 + ri(r, 3) * 10)]; }

    var shbr = [{ iface: sif, ip: fault === 'vlan' ? 'unassigned' : ip, status: status, proto: proto }];
    var shint = ifn + ' is ' + (status === 'administratively down' ? 'administratively down' : status) + ', line protocol is ' + proto +
      (fault === 'cable' ? ' (notconnect)' : '') + '\n  Internet address is ' + (fault === 'vlan' ? '—' : ip + '/24') + '\n ' + (proto === 'up' ? shintTail : ' (keine Zähler – Interface down)');

    return {
      fault: fault, dev: dev, ifn: ifn, sif: sif, ip: ip, peerIp: peerIp, mask: mask,
      symptom: symptom, shbr: shbr, shint: shint, shrun: shrun.join('\n'),
      causeTxt: CAUSES.filter(function (c) { return c.id === fault; })[0].txt,
      fixId: MAP[fault], fixTxt: FIXES.filter(function (f) { return f.id === MAP[fault]; })[0].txt
    };
  }

  function makeTask(seed, lvl) {
    if (!LVCODE[lvl] || !(seed >= 1)) return null;
    var r = mulberry32((seed * 7919 + LVCODE[lvl] * 1000003 + 8101) >>> 0);
    var s = build(r, lvl); s.level = lvl; s.code = lvl + '-' + seed; return s;
  }
  G.TS = { LVNAME: LVNAME, CAUSES: CAUSES, FIXES: FIXES, MAP: MAP, makeTask: makeTask, mulberry32: mulberry32 };
})(typeof window !== 'undefined' ? window : globalThis);
