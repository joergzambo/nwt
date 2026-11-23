/* Sicherer Gerätezugang: SSH, RADIUS, Konsole – Audit-Generator (unsichere Zeilen finden).
   Browser: window.SSH · Node: globalThis.SSH  */
(function (G) {
  var LVNAME = { L: 'Leicht', M: 'Mittel', S: 'Schwer' };
  var LVCODE = { L: 3, M: 4, S: 5 };
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function ri(r, n) { return Math.floor(r() * n); }
  function pick(r, a) { return a[ri(r, a.length)]; }

  var HOSTS = ['R1', 'R2', 'SW1', 'CORE', 'EDGE', 'ACCESS1', 'DIST1', 'GW'];
  var DOMAINS = ['htl.local', 'firma.at', 'campus.net', 'lab.local', 'acme.corp'];
  var USERS = ['admin', 'netadmin', 'operator', 'itadmin'];

  /* Alle möglichen Sicherheitslücken */
  var FLAWS = [
    { id: 'telnet', txt: 'Telnet ist erlaubt (unverschlüsselt)' },
    { id: 'novtyauth', txt: 'VTY ohne Authentifizierung (kein login local / AAA)' },
    { id: 'console', txt: 'Konsole ohne Passwortschutz' },
    { id: 'sshv1', txt: 'SSH Version 1 statt 2' },
    { id: 'notimeout', txt: 'Sitzung läuft nie ab (exec-timeout 0 0)' },
    { id: 'enablepw', txt: 'enable password im Klartext statt enable secret' },
    { id: 'weakkey', txt: 'RSA-Schlüssel zu kurz (512 statt ≥2048 Bit)' }
  ];

  function build(r, lvl) {
    var host = pick(r, HOSTS), dom = pick(r, DOMAINS), user = pick(r, USERS);
    var radIP = '10.' + (1 + ri(r, 60)) + '.' + ri(r, 200) + '.' + (1 + ri(r, 60));
    var radKey = pick(r, ['Str0ngKey!', 'Sh4redSecret', 'R4d1us#2024', 'AAApass!99']);
    var useRadius = lvl !== 'L' && r() < 0.6;
    // Wie viele Lücken? L:1-2, M:2-3, S:3-4
    var nflaw = lvl === 'L' ? 1 + ri(r, 2) : lvl === 'M' ? 2 + ri(r, 2) : 3 + ri(r, 2);
    var pool = FLAWS.map(function (f) { return f.id; });
    var active = {};
    var order = pool.slice();
    for (var i = order.length - 1; i > 0; i--) { var j = ri(r, i + 1); var t = order[i]; order[i] = order[j]; order[j] = t; }
    order.slice(0, nflaw).forEach(function (id) { active[id] = true; });

    // Konfig-Zeilen zusammenstellen (mit/ohne Lücken)
    var L = [];
    L.push('hostname ' + host);
    L.push('ip domain-name ' + dom);
    L.push(active.weakkey ? 'crypto key generate rsa modulus 512' : 'crypto key generate rsa modulus 2048');
    L.push(active.enablepw ? 'enable password cisco123' : 'enable secret cisco123');
    L.push('!');
    if (useRadius) {
      L.push('aaa new-model');
      L.push('radius server RAD1');
      L.push(' address ipv4 ' + radIP + ' auth-port 1812 acct-port 1813');
      L.push(' key ' + radKey);
      L.push('aaa authentication login default group radius local');
      L.push('!');
    }
    L.push('username ' + user + ' secret cisco123');
    L.push('!');
    L.push('line console 0');
    if (active.console) { L.push(' ! (keine Absicherung)'); }
    else { L.push(useRadius ? ' login authentication default' : ' login local'); L.push(' exec-timeout 5 0'); L.push(' logging synchronous'); }
    L.push('!');
    L.push('line vty 0 4');
    L.push(active.telnet ? ' transport input telnet ssh' : ' transport input ssh');
    if (!active.novtyauth) L.push(useRadius ? ' login authentication default' : ' login local');
    L.push(active.notimeout ? ' exec-timeout 0 0' : ' exec-timeout 5 0');
    L.push('!');
    L.push('ip ssh version ' + (active.sshv1 ? '1' : '2'));

    var activeList = FLAWS.filter(function (f) { return active[f.id]; });
    return {
      host: host, dom: dom, user: user, radIP: radIP, radKey: radKey, useRadius: useRadius,
      config: L, flaws: activeList.map(function (f) { return f.id; }),
      flawTxt: activeList.map(function (f) { return f.txt; })
    };
  }

  function makeTask(seed, lvl) {
    if (!LVCODE[lvl] || !(seed >= 1)) return null;
    var r = mulberry32((seed * 7919 + LVCODE[lvl] * 1000003 + 6421) >>> 0);
    var s = build(r, lvl);
    s.level = lvl; s.code = lvl + '-' + seed;
    return s;
  }
  G.SSH = { LVNAME: LVNAME, FLAWS: FLAWS, makeTask: makeTask, mulberry32: mulberry32 };
})(typeof window !== 'undefined' ? window : globalThis);
