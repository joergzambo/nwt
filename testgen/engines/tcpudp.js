/* TCP und UDP (Transportschicht): Ports/Dienste + TCP-vs-UDP-Szenarien.
   Browser: window.TCP · Node: globalThis.TCP  */
(function (G) {
  var LVNAME = { L: 'Leicht', M: 'Mittel', S: 'Schwer' };
  var LVCODE = { L: 3, M: 4, S: 5 };
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function ri(r, n) { return Math.floor(r() * n); }
  function pick(r, a) { return a[ri(r, a.length)]; }

  /* Dienste-Katalog: Name, Port, Transport */
  var SERVICES = [
    { name: 'HTTP', port: 80, proto: 'TCP', lvl: 'L' },
    { name: 'HTTPS', port: 443, proto: 'TCP', lvl: 'L' },
    { name: 'SSH', port: 22, proto: 'TCP', lvl: 'L' },
    { name: 'Telnet', port: 23, proto: 'TCP', lvl: 'L' },
    { name: 'DNS', port: 53, proto: 'UDP', lvl: 'L' },
    { name: 'FTP (Steuerung)', port: 21, proto: 'TCP', lvl: 'M' },
    { name: 'SMTP', port: 25, proto: 'TCP', lvl: 'M' },
    { name: 'POP3', port: 110, proto: 'TCP', lvl: 'M' },
    { name: 'IMAP', port: 143, proto: 'TCP', lvl: 'M' },
    { name: 'DHCP (Server)', port: 67, proto: 'UDP', lvl: 'M' },
    { name: 'TFTP', port: 69, proto: 'UDP', lvl: 'M' },
    { name: 'SNMP', port: 161, proto: 'UDP', lvl: 'S' },
    { name: 'NTP', port: 123, proto: 'UDP', lvl: 'S' },
    { name: 'Syslog', port: 514, proto: 'UDP', lvl: 'S' },
    { name: 'RDP', port: 3389, proto: 'TCP', lvl: 'S' }
  ];
  /* Szenarien: Anwendungsfall -> TCP/UDP */
  var SCEN = [
    { txt: 'Eine Webseite im Browser laden', ans: 'TCP', why: 'HTTP/HTTPS muss vollständig und fehlerfrei ankommen – TCP sorgt für Zuverlässigkeit.', lvl: 'L' },
    { txt: 'Live-Videostreaming / VoIP-Telefonat', ans: 'UDP', why: 'Echtzeit zählt mehr als Vollständigkeit – kleine Verluste sind besser als Verzögerung durch Neuübertragung.', lvl: 'L' },
    { txt: 'Eine DNS-Anfrage stellen', ans: 'UDP', why: 'Kurze Anfrage/Antwort – UDP ist schneller, ohne Verbindungsaufbau.', lvl: 'L' },
    { txt: 'Eine große Datei herunterladen', ans: 'TCP', why: 'Die Datei muss komplett und in richtiger Reihenfolge ankommen – TCP.', lvl: 'M' },
    { txt: 'Online-Multiplayer in Echtzeit', ans: 'UDP', why: 'Geringe Latenz ist entscheidend – UDP, veraltete Pakete werden einfach verworfen.', lvl: 'M' },
    { txt: 'Eine E-Mail an den Server senden (SMTP)', ans: 'TCP', why: 'Nachrichten dürfen nicht verloren gehen – TCP.', lvl: 'M' },
    { txt: 'Ein IOS-Image per TFTP übertragen', ans: 'UDP', why: 'TFTP nutzt UDP (Port 69) mit eigenem einfachen Quittungsverfahren.', lvl: 'S' },
    { txt: 'Zeitsynchronisation per NTP', ans: 'UDP', why: 'Kurze, häufige Pakete – UDP (Port 123).', lvl: 'S' }
  ];

  function build(r, lvl) {
    var pool = lvl === 'L' ? ['L'] : lvl === 'M' ? ['L', 'M'] : ['L', 'M', 'S'];
    var type = pick(r, lvl === 'L' ? ['port', 'scen'] : ['port', 'port', 'scen']);
    if (type === 'scen') {
      var sc = pick(r, SCEN.filter(function (x) { return pool.indexOf(x.lvl) >= 0; }));
      return { type: 'scen', scen: sc.txt, ans: sc.ans, why: sc.why };
    }
    var sv = pick(r, SERVICES.filter(function (x) { return pool.indexOf(x.lvl) >= 0; }));
    // Richtung: Dienst->Port (häufiger) oder Port->Dienst
    var dir = r() < 0.7 ? 'svc2port' : 'port2svc';
    return { type: 'port', dir: dir, svc: sv.name, port: sv.port, proto: sv.proto };
  }

  function makeTask(seed, lvl) {
    if (!LVCODE[lvl] || !(seed >= 1)) return null;
    var r = mulberry32((seed * 7919 + LVCODE[lvl] * 1000003 + 2069) >>> 0);
    var s = build(r, lvl); s.level = lvl; s.code = lvl + '-' + seed; return s;
  }
  G.TCP = { LVNAME: LVNAME, SERVICES: SERVICES, SCEN: SCEN, makeTask: makeTask, mulberry32: mulberry32 };
})(typeof window !== 'undefined' ? window : globalThis);
