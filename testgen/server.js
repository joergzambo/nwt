/* Lokaler Testgenerator – läuft nur auf deinem Rechner (localhost).
   Start:  npm start     danach  http://localhost:3000  im Browser öffnen. */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { TOPICS, buildGroups } = require('./topics.js');
const { buildTest } = require('./docx.js');

const PORT = process.env.PORT || 3000;

function send(res, code, type, body) {
  res.writeHead(code, { 'Content-Type': type });
  res.end(body);
}
function monthNow() {
  const d = new Date();
  return String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
}

const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, 'http://localhost');
    if (req.method === 'GET' && u.pathname === '/') {
      return send(res, 200, 'text/html; charset=utf-8', fs.readFileSync(path.join(__dirname, 'public', 'index.html')));
    }
    if (req.method === 'GET' && u.pathname === '/api/topics') {
      const list = Object.keys(TOPICS).map(id => ({ id, label: TOPICS[id].label, levels: TOPICS[id].levels }));
      return send(res, 200, 'application/json', JSON.stringify({ topics: list, month: monthNow() }));
    }
    if (req.method === 'POST' && u.pathname === '/api/generate') {
      let raw = '';
      req.on('data', c => raw += c);
      req.on('end', async () => {
        try {
          const o = JSON.parse(raw || '{}');
          const topic = o.topic;
          const levels = (o.levels && o.levels.length) ? o.levels : ['M'];
          const count = Math.max(1, Math.min(30, +o.count || 4));
          const month = o.month || monthNow();
          const withSol = o.withSolutions !== false;
          if (!TOPICS[topic]) return send(res, 400, 'application/json', JSON.stringify({ error: 'Unbekanntes Thema' }));
          const g = buildGroups(topic, levels, count, o.seed || null);
          const buf = await buildTest({ month, groups: g.groups, solutions: withSol ? g.solutions : null });
          const fname = 'Test_' + topic + '_' + month.replace('/', '-') + '.docx';
          res.writeHead(200, {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': 'attachment; filename="' + fname + '"',
            'X-Seed': String(g.seedBase)
          });
          res.end(buf);
        } catch (e) {
          send(res, 500, 'application/json', JSON.stringify({ error: String(e && e.message || e) }));
        }
      });
      return;
    }
    send(res, 404, 'text/plain', 'Not found');
  } catch (e) {
    send(res, 500, 'text/plain', String(e));
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('NWT-Testgenerator läuft:  http://localhost:' + PORT);
  console.log('(Beenden mit Strg+C)');
});
