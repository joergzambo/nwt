/* Orchestrator: Auto-Abgleich ausführen, Generatoren + Themen laden, Gruppen bauen. */
const path = require('path');
const fs = require('fs');
const sync = require('./sync.js');

const LV = ['L', 'M', 'S'];
const LVNAME = { L: 'Leicht', M: 'Mittel', S: 'Schwer' };

let TOPICS = {};
let SYNC_INFO = { status: 'unbekannt', version: 0, msg: '' };

function loadExternalTopics() {
  const base = sync.baseDir();
  const dir = path.join(base, 'themen');
  const added = [];
  try {
    if (!fs.existsSync(dir)) return added;
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.js')) continue;
      try {
        const mod = require(path.join(dir, f));
        if (mod && mod.id && typeof mod.gen === 'function') {
          TOPICS[mod.id] = { label: mod.label || mod.id, levels: mod.levels || LV,
            points: mod.points || { L: 2, M: 3, S: 4 }, gen: mod.gen };
          added.push(mod.id);
        }
      } catch (e) { console.error('Thema-Datei übersprungen (' + f + '):', e.message); }
    }
  } catch (e) { /* kein themen-Ordner */ }
  return added;
}

function slug(s) {
  return s.toLowerCase().replace(/[äöü]/g, c => ({ 'ä': 'ae', 'ö': 'oe', 'ü': 'ue' }[c]))
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
/* Fragen-Pool aus pool.json als "Fragenkatalog"-Themen (offene Fragen aus alten Tests) */
function loadPoolTopics() {
  try {
    const p = sync.resolveFile('pool.json');
    if (!fs.existsSync(p)) return;
    const pool = JSON.parse(fs.readFileSync(p, 'utf8'));
    const order = pool.order || Object.keys(pool.groups || {});
    for (const name of order) {
      const qs = (pool.groups || {})[name] || [];
      if (qs.length < 2) continue;
      const curated = qs.some(x => x.a || x.p);
      const srcLabel = curated ? 'kuratierter Katalog' : 'Fragen aus alten Tests';
      TOPICS['pool-' + slug(name)] = {
        label: 'Fragenkatalog: ' + name + ' (' + qs.length + ' ' + srcLabel + ')',
        levels: LV, points: { L: 2, M: 3, S: 4 }, isPool: true,
        gen(seed, lvl) {
          let sub = qs.filter(x => !x.lvl || x.lvl === lvl);
          if (!sub.length) sub = qs;
          const item = sub[((seed % sub.length) + sub.length) % sub.length];
          return { intro: '', lines: [item.q],
            points: (item.p != null ? item.p : undefined),
            solution: [item.a ? ('(Vorschlag) ' + item.a) : '(offene Frage – Bewertung durch Lehrkraft)'] };
        }
      };
    }
  } catch (e) { console.error('Pool nicht geladen:', e.message); }
}

function loadFresh(file) {
  // Cache-Version bevorzugen; require-Cache leeren, damit Updates greifen
  const p = sync.resolveFile(file);
  try { delete require.cache[require.resolve(p)]; } catch (e) {}
  return require(p);
}

async function init(logfn) {
  SYNC_INFO = await sync.run(logfn);
  // Generatoren laden (setzen globalThis.NA/SN/VD)
  loadFresh('engines/netz.js');
  loadFresh('engines/sub.js');
  loadFresh('engines/dtp.js');
  loadFresh('engines/ec.js');
  loadFresh('engines/acl.js');
  loadFresh('engines/fhrp.js');
  loadFresh('engines/zs.js');
  loadFresh('engines/route.js');
  loadFresh('engines/domains.js');
  loadFresh('engines/dijk.js');
  loadFresh('engines/ospfref.js');
  loadFresh('engines/wild.js');
  loadFresh('engines/ssh.js');
  loadFresh('engines/cli.js');
  const defs = loadFresh('topicdefs.js');
  TOPICS = defs.build({ NA: globalThis.NA, SN: globalThis.SN, VD: globalThis.VD,
    EC: globalThis.EC, ACL: globalThis.ACL, FH: globalThis.FH, ZS: globalThis.ZS, IR: globalThis.IR, DOM: globalThis.DOM, DJ: globalThis.DJ, ORB: globalThis.ORB, WC: globalThis.WC, SSH: globalThis.SSH, CLI: globalThis.CLI });
  loadPoolTopics();
  const ext = loadExternalTopics();
  return { topicsCount: Object.keys(TOPICS).length, external: ext, sync: SYNC_INFO };
}

function buildGroups(topicId, levels, count, seedBase) {
  const t = TOPICS[topicId];
  if (!t) throw new Error('Unbekanntes Thema: ' + topicId);
  seedBase = seedBase || Math.floor(Math.random() * 1500) + 1;
  const OFF = 2003; // Primzahl: verschiedene Gruppen, Seeds bleiben klein/auflösbar
  const g1 = [], g2 = [], sol1 = [], sol2 = [];
  const num = (s, lvl) => (t.tag ? t.tag + '-' + lvl + '-' + s : null);
  for (let i = 0; i < count; i++) {
    const lvl = levels[i % levels.length];
    const s1 = seedBase + i, s2 = seedBase + OFF + i;
    const e1 = t.gen(s1, lvl), e2 = t.gen(s2, lvl);
    const n1 = num(s1, lvl), n2 = num(s2, lvl);
    const l1 = n1 ? ['Übung ' + n1].concat(e1.lines) : e1.lines;
    const l2 = n2 ? ['Übung ' + n2].concat(e2.lines) : e2.lines;
    g1.push({ intro: e1.intro, lines: l1, points: (e1.points != null ? e1.points : t.points[lvl]) });
    g2.push({ intro: e2.intro, lines: l2, points: (e2.points != null ? e2.points : t.points[lvl]) });
    sol1.push('A' + (i + 1) + (n1 ? ' [' + n1 + ']' : '') + ' (' + LVNAME[lvl] + '): ' + e1.solution.join(' | '));
    sol2.push('A' + (i + 1) + (n2 ? ' [' + n2 + ']' : '') + ' (' + LVNAME[lvl] + '): ' + e2.solution.join(' | '));
  }
  return { groups: [{ examples: g1 }, { examples: g2 }],
    solutions: [{ title: 'Gruppe 1', lines: sol1 }, { title: 'Gruppe 2', lines: sol2 }], seedBase };
}

module.exports = {
  init, buildGroups, LVNAME,
  getTopics: () => TOPICS,
  getSyncInfo: () => SYNC_INFO
};
