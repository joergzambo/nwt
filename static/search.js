/* NWT · Suche in der Titelleiste.
   Live-Vorschläge über alle Themen (window.NWT_INDEX). Auf Generator-Seiten
   öffnet eine eingegebene Beispielnummer (z. B. M-305) zusätzlich direkt das Beispiel. */
(function () {
  'use strict';
  var wrap = document.getElementById('aecp-find');
  var inp = document.getElementById('aecp-find-in');
  var list = document.getElementById('aecp-find-list');
  var IDX = window.NWT_INDEX || [];
  if (!wrap || !inp || !list) return;

  var WCH = /[a-z0-9äöüß]/;
  function wb(hay, tok) { var i = hay.indexOf(tok); while (i >= 0) { if (i === 0 || !WCH.test(hay.charAt(i - 1))) return true; i = hay.indexOf(tok, i + 1); } return false; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---- Generator der aktuellen Seite (für Beispielnummern) ---- */
  function byId() { for (var i = 0; i < arguments.length; i++) { var e = document.getElementById(arguments[i]); if (e) return e; } return null; }
  function genInput() {
    var e = byId('gcode', 'gencode', 'ltcode'); if (e) return e;
    var cand = document.querySelectorAll('#generator input[placeholder], .genbar input[placeholder], .gen input[placeholder]');
    for (var i = 0; i < cand.length; i++) if (/^[A-Za-z]\s*-?\s*\d/.test(cand[i].getAttribute('placeholder') || '')) return cand[i];
    return null;
  }
  function genButton(input) {
    var b = byId('gload', 'genload'); if (b) return b;
    if (!input) return null;
    var box = input.closest('.genbar, #generator, .gen, section') || document;
    var bs = box.querySelectorAll('button');
    for (var i = 0; i < bs.length; i++) if (/laden/i.test(bs[i].textContent)) return bs[i];
    return null;
  }
  var gIn = genInput(), gBtn = genButton(gIn);
  var CODE = /^[A-Za-z]\s*-?\s*\d{1,6}$/;
  function loadExample(code) {
    if (!gIn || !gBtn) return false;
    gIn.value = code.toUpperCase().replace(/\s+/g, '');
    gBtn.click();
    var t = byId('gout', 'genout') || (gIn.closest('#generator, section')) || gIn;
    if (t && t.scrollIntoView) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return true;
  }

  /* ---- Themen-Treffer ---- */
  function topics(v) {
    var toks = v.split(/\s+/), hits = [];
    IDX.forEach(function (it) {
      var hay = (it.t + ' ' + it.d + ' ' + it.a).toLowerCase(), tl = it.t.toLowerCase();
      if (!toks.every(function (tk) { return wb(hay, tk); })) return;
      var s = (it.on ? 1 : 0); toks.forEach(function (tk) { if (wb(tl, tk)) s += 3; });
      hits.push({ it: it, s: s });
    });
    hits.sort(function (a, b) { return b.s - a.s; });
    return hits.map(function (h) { return h.it; });
  }

  var items = [], active = -1;
  function render(v) {
    items = [];
    var raw = v.trim();
    if (!raw) { close(); return; }
    // Beispielnummer zuerst, wenn Generator vorhanden
    if (gIn && gBtn && CODE.test(raw)) {
      items.push({ kind: 'ex', code: raw, label: 'Beispiel ' + raw.toUpperCase().replace(/\s+/g, '') + ' öffnen', meta: 'auf dieser Seite' });
    }
    topics(raw.toLowerCase()).slice(0, 8).forEach(function (it) {
      items.push({ kind: it.on ? 'go' : 'soon', u: it.u, label: it.t, meta: it.a });
    });
    if (!items.length) {
      list.innerHTML = '<li class="aecp-find-none" aria-disabled="true">Nichts gefunden – anderes Stichwort probieren</li>';
      open(); active = -1; return;
    }
    list.innerHTML = items.map(function (x, i) {
      var cls = 'aecp-find-opt' + (x.kind === 'ex' ? ' is-ex' : '') + (x.kind === 'soon' ? ' is-soon' : '');
      return '<li class="' + cls + '" role="option" data-i="' + i + '">' +
        '<span class="ti">' + esc(x.label) + '</span><span class="ar">' + esc(x.meta) + (x.kind === 'soon' ? ' · in Vorbereitung' : '') + '</span></li>';
    }).join('');
    open(); setActive(0);
  }
  function open() { list.hidden = false; inp.setAttribute('aria-expanded', 'true'); }
  function close() { list.hidden = true; list.innerHTML = ''; inp.setAttribute('aria-expanded', 'false'); active = -1; }
  function setActive(i) {
    var opts = list.querySelectorAll('.aecp-find-opt'); if (!opts.length) return;
    active = (i + opts.length) % opts.length;
    [].forEach.call(opts, function (o, j) { o.classList.toggle('on', j === active); });
    opts[active].scrollIntoView({ block: 'nearest' });
  }
  function choose(i) {
    var x = items[i]; if (!x) return;
    if (x.kind === 'ex') { if (loadExample(x.code)) { close(); inp.blur(); } return; }
    if (x.kind === 'soon') return;              // in Vorbereitung: kein Ziel
    if (x.u) location.href = x.u;
  }

  inp.addEventListener('input', function () { render(inp.value); });
  inp.addEventListener('focus', function () { if (inp.value.trim()) render(inp.value); });
  inp.addEventListener('keydown', function (e) {
    if (list.hidden) { if (e.key === 'ArrowDown' && inp.value.trim()) render(inp.value); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(active < 0 ? 0 : active); }
    else if (e.key === 'Escape') { close(); }
  });
  list.addEventListener('mousedown', function (e) { var li = e.target.closest('.aecp-find-opt'); if (li) { e.preventDefault(); choose(+li.getAttribute('data-i')); } });
  document.addEventListener('click', function (e) { if (!wrap.contains(e.target)) close(); });
})();
