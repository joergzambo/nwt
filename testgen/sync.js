/* Auto-Abgleich: holt beim Start die aktuellen Themen/Generatoren aus dem Repo
   und legt sie in einen Cache-Ordner neben dem Programm. Offline/kein Netz ->
   es wird der zuletzt geholte Cache bzw. der eingebaute Stand verwendet. */
const https = require('https');
const fs = require('fs');
const path = require('path');

const DEFAULTS = { repo: 'joergzambo/nwt', branch: 'main', base: 'testgen' };
const SYNC_FILES = ['engines/netz.js', 'engines/sub.js', 'engines/dtp.js', 'engines/ec.js', 'engines/acl.js', 'engines/fhrp.js', 'engines/zs.js', 'engines/route.js', 'engines/domains.js', 'engines/dijk.js', 'engines/ospfref.js', 'engines/wild.js', 'engines/ssh.js', 'engines/cli.js', 'engines/stpatk.js', 'engines/ripauth.js', 'engines/cdpflood.js', 'topicdefs.js', 'pool.json'];

function baseDir() { return process.pkg ? path.dirname(process.execPath) : __dirname; }
function cacheDir() { return path.join(baseDir(), 'cache'); }

function config() {
  // optionale Override-Datei neben dem Programm
  try { return Object.assign({}, DEFAULTS, JSON.parse(fs.readFileSync(path.join(baseDir(), 'sync-config.json'), 'utf8'))); }
  catch (e) { return Object.assign({}, DEFAULTS); }
}
function rawUrl(c, file) {
  return 'https://raw.githubusercontent.com/' + c.repo + '/' + c.branch + '/' + c.base + '/' + file + '?t=' + Date.now();
}
function get(url, timeoutMs) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, r => {
      if (r.statusCode !== 200) { r.resume(); return reject(new Error('HTTP ' + r.statusCode)); }
      let d = ''; r.on('data', c => d += c); r.on('end', () => resolve(d));
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs || 4000, () => { req.destroy(new Error('timeout')); });
  });
}
function localVersion() {
  try { return +fs.readFileSync(path.join(cacheDir(), 'version.txt'), 'utf8').trim() || 0; } catch (e) { return 0; }
}
function cacheComplete() {
  return SYNC_FILES.every(f => fs.existsSync(path.join(cacheDir(), f)));
}

/* Gibt {status, version, msg} zurück. status: 'aktuell' | 'aktualisiert' | 'offline' */
async function run(logfn) {
  const log = logfn || (() => {});
  const c = config();
  try {
    const man = JSON.parse(await get(rawUrl(c, 'sync-manifest.json'), 4000));
    const remoteVer = +man.version || 0;
    const files = Array.isArray(man.files) ? man.files : SYNC_FILES;
    if (remoteVer <= localVersion() && cacheComplete()) {
      return { status: 'aktuell', version: remoteVer, msg: 'Themen sind aktuell (Stand ' + remoteVer + ').' };
    }
    // alle Dateien herunterladen (erst in temp, dann übernehmen)
    const got = {};
    for (const f of files) got[f] = await get(rawUrl(c, f), 6000);
    fs.mkdirSync(cacheDir(), { recursive: true });
    for (const f of files) {
      const dest = path.join(cacheDir(), f);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, got[f]);
    }
    fs.writeFileSync(path.join(cacheDir(), 'version.txt'), String(remoteVer));
    return { status: 'aktualisiert', version: remoteVer, msg: 'Themen aktualisiert auf Stand ' + remoteVer + '.' };
  } catch (e) {
    const v = localVersion();
    return { status: 'offline', version: v, msg: 'Kein Abgleich möglich (' + e.message + ') – nutze ' + (cacheComplete() ? 'zuletzt geladenen Stand ' + v : 'eingebauten Stand') + '.' };
  }
}

/* Pfad zu einer Datei: Cache bevorzugt, sonst eingebaut */
function resolveFile(file) {
  const c = path.join(cacheDir(), file);
  return fs.existsSync(c) ? c : path.join(__dirname, file);
}

module.exports = { run, resolveFile, SYNC_FILES, baseDir, cacheDir };
