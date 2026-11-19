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
  const defs = loadFresh('topicdefs.js');
  TOPICS = defs.build({ NA: globalThis.NA, SN: globalThis.SN, VD: globalThis.VD });
  const ext = loadExternalTopics();
  return { topicsCount: Object.keys(TOPICS).length, external: ext, sync: SYNC_INFO };
}

function buildGroups(topicId, levels, count, seedBase) {
  const t = TOPICS[topicId];
  if (!t) throw new Error('Unbekanntes Thema: ' + topicId);
  seedBase = seedBase || Math.floor(Math.random() * 90000) + 1000;
  const OFF = 50000;
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
  return { groups: [{ examples: g1 }, { examples: g2 }],
    solutions: [{ title: 'Gruppe 1', lines: sol1 }, { title: 'Gruppe 2', lines: sol2 }], seedBase };
}

module.exports = {
  init, buildGroups, LVNAME,
  getTopics: () => TOPICS,
  getSyncInfo: () => SYNC_INFO
};
