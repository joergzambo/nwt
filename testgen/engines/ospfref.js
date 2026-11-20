/* OSPF-Referenzbandbreite: zeigt running-configs mehrerer Router; gesucht ist der
   auto-cost reference-bandwidth-Wert (= schnellste Leitung in Mbps, auf allen Routern gleich).
   Browser: window.ORB · Node: globalThis.ORB  */
(function (G) {
  const LVNAME = { L: 'Leicht', M: 'Mittel', S: 'Schwer' };
  const LVCODE = { L: 3, M: 4, S: 5 };
  const TIERS = [
    { t: 'FastEthernet', bw: 100 },
    { t: 'GigabitEthernet', bw: 1000 },
    { t: 'TenGigabitEthernet', bw: 10000 }
  ];
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  const ri = (r, n) => Math.floor(r() * n);

  function build(r, lvl) {
    const nR = lvl === 'L' ? 2 : 3;
    // höchste Tier-Stufe im Netz
    let maxIdx = lvl === 'L' ? 1 : lvl === 'S' ? 2 : (1 + ri(r, 2)); // L:Gi, M:Gi/Te, S:Te
    const routers = [];
    let placedMax = false;
    for (let ridx = 0; ridx < nR; ridx++) {
      const nIf = 2 + ri(r, 2); // 2-3 Interfaces
      const ifs = [];
      for (let k = 0; k < nIf; k++) {
        let tier = ri(r, maxIdx + 1);
        ifs.push({ tier: tier });
      }
      routers.push({ name: 'R' + (ridx + 1), ifs: ifs });
    }
    // sicherstellen, dass die höchste Stufe mindestens einmal vorkommt
    const hasMax = routers.some(R => R.ifs.some(i => i.tier === maxIdx));
    if (!hasMax) routers[ri(r, nR)].ifs[0].tier = maxIdx;
    // mindestens zwei verschiedene Bandbreiten (sonst gibt es nichts zu unterscheiden)
    const all = routers.flatMap(R => R.ifs);
    const distinct = new Set(all.map(i => i.tier));
    if (distinct.size < 2) {
      // eine (nicht die einzige max-) Leitung auf eine niedrigere Stufe setzen
      const lower = lvl === 'S' ? 0 : (maxIdx > 0 ? maxIdx - 1 : 0);
      all[all.length - 1].tier = lower;
      // falls dadurch die max-Stufe verschwände, sichern
      if (!all.some(i => i.tier === maxIdx)) all[0].tier = maxIdx;
    }
    // IPs + Interface-Namen vergeben
    routers.forEach((R, ridx) => {
      R.ifs.forEach((i, k) => {
        const T = TIERS[i.tier];
        i.name = T.t + '0/' + k;
        i.bw = T.bw;
        i.ip = '10.' + (ridx + 1) + '.' + k + '.1';
      });
    });
    const ref = TIERS[maxIdx].bw;           // schnellste Leitung in Mbps
    const refName = TIERS[maxIdx].t;
    // vorkommende Bandbreiten -> Kosten bei ref
    const bws = [...new Set(routers.flatMap(R => R.ifs.map(i => i.bw)))].sort((a, b) => b - a);
    const costs = bws.map(bw => ({ bw: bw, cost: Math.max(1, Math.round(ref / bw)) }));
    return { routers: routers, ref: ref, refName: refName, costs: costs, maxIdx: maxIdx };
  }

  function cfgLines(R) {
    const out = ['hostname ' + R.name, '!'];
    R.ifs.forEach(i => {
      out.push('interface ' + i.name);
      out.push(' ip address ' + i.ip + ' 255.255.255.0');
    });
    out.push('!');
    out.push('router ospf 1');
    out.push(' router-id ' + R.ifs[0].ip);
    return out;
  }

  function makeTask(seed, lvl) {
    if (!LVCODE[lvl] || !(seed >= 1)) return null;
    const r = mulberry32((seed * 7919 + LVCODE[lvl] * 1000003 + 5171) >>> 0);
    const s = build(r, lvl);
    s.level = lvl; s.code = lvl + '-' + seed;
    return s;
  }
  G.ORB = { LVNAME: LVNAME, TIERS: TIERS, makeTask: makeTask, cfgLines: cfgLines, mulberry32: mulberry32 };
})(typeof window !== 'undefined' ? window : globalThis);
