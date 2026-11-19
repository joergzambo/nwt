/* Lokaler Testgenerator mit Auto-Abgleich – läuft nur auf deinem Rechner (localhost). */
const http = require('http');
const fs = require('fs');
const path = require('path');
const topics = require('./topics.js');
const { buildTest } = require('./docx.js');

const PORT = process.env.PORT || 3000;

function send(res, code, type, body) { res.writeHead(code, { 'Content-Type': type }); res.end(body); }
function monthNow() { const d = new Date(); return String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear(); }
function assetDir() { return __dirname; } // public liegt im Snapshot bzw. neben dem Skript

function startServer() {
  const server = http.createServer((req, res) => {
    try {
      const u = new URL(req.url, 'http://localhost');
      if (req.method === 'GET' && u.pathname === '/') {
        return send(res, 200, 'text/html; charset=utf-8', fs.readFileSync(path.join(assetDir(), 'public', 'index.html')));
      }
      if (req.method === 'GET' && u.pathname === '/api/topics') {
        const T = topics.getTopics();
        const list = Object.keys(T).map(id => ({ id, label: T[id].label, levels: T[id].levels }));
        const s = topics.getSyncInfo();
        return send(res, 200, 'application/json', JSON.stringify({ topics: list, month: monthNow(), sync: s }));
      }
      if (req.method === 'POST' && u.pathname === '/api/generate') {
        let raw = ''; req.on('data', c => raw += c);
        req.on('end', async () => {
          try {
            const o = JSON.parse(raw || '{}');
            const levels = (o.levels && o.levels.length) ? o.levels : ['M'];
            const count = Math.max(1, Math.min(30, +o.count || 4));
            const month = o.month || monthNow();
            const withSol = o.withSolutions !== false;
            if (!topics.getTopics()[o.topic]) return send(res, 400, 'application/json', JSON.stringify({ error: 'Unbekanntes Thema' }));
            const g = topics.buildGroups(o.topic, levels, count, o.seed || null);
            const buf = await buildTest({ month, groups: g.groups, solutions: withSol ? g.solutions : null });
            const fname = 'Test_' + o.topic + '_' + month.replace('/', '-') + '.docx';
            res.writeHead(200, {
              'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'Content-Disposition': 'attachment; filename="' + fname + '"', 'X-Seed': String(g.seedBase)
            });
            res.end(buf);
          } catch (e) { send(res, 500, 'application/json', JSON.stringify({ error: String(e && e.message || e) })); }
        });
        return;
      }
      send(res, 404, 'text/plain', 'Not found');
    } catch (e) { send(res, 500, 'text/plain', String(e)); }
  });
  server.listen(PORT, '127.0.0.1', () => {
    const url = 'http://localhost:' + PORT;
    console.log('NWT-Testgenerator läuft:  ' + url);
    console.log('(Dieses Fenster offen lassen. Beenden: Fenster schließen oder Strg+C.)');
    try {
      const { spawn } = require('child_process'); const p = process.platform;
      if (p === 'win32') spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' });
      else if (p === 'darwin') spawn('open', [url], { detached: true, stdio: 'ignore' });
      else spawn('xdg-open', [url], { detached: true, stdio: 'ignore' });
    } catch (e) {}
  });
}

(async () => {
  console.log('Suche nach neuen Themen …');
  try {
    const r = await topics.init(msg => console.log(msg));
    console.log(r.sync.msg + '  (' + r.topicsCount + ' Themen' + (r.external.length ? ', davon extra: ' + r.external.join(', ') : '') + ')');
  } catch (e) {
    console.error('Start-Abgleich fehlgeschlagen, nutze eingebauten Stand:', e.message);
    try { await topics.init(); } catch (e2) {}
  }
  startServer();
})();
