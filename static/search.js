/* NWT · Suche in der Titelleiste + eindeutige Beispielnummern.
   - Live-Themensuche über window.NWT_INDEX.
   - Beispielnummern tragen ein Themen-Kürzel (z. B. VLN-M-305) und sind damit
     überall eindeutig: von jeder Seite springt eine getaggte Nummer zum richtigen
     Thema und lädt das Beispiel. Auf der Themenseite zeigt der Generator die Nummer
     ebenfalls mit Kürzel an. */
(function () {
  'use strict';
  var IDX = window.NWT_INDEX || [];
  var PAGE_TAG = String(window.NWT_TAG || '').toUpperCase();
  var byTag = {};
  IDX.forEach(function (it) { if (it.g) byTag[String(it.g).toUpperCase()] = it; });

  var WCH = /[a-z0-9äöüß]/;
  function wb(hay, tok) { var i = hay.indexOf(tok); while (i >= 0) { if (i === 0 || !WCH.test(hay.charAt(i - 1))) return true; i = hay.indexOf(tok, i + 1); } return false; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* Beispielnummer parsen. Kürzel ist immer 3-stellig (VLN, OS2, SUB …),
     der native Code hat 1–2 Buchstaben (M-305 bzw. VM-305 bei Subnetting). */
  function parseCode(raw) {
    raw = String(raw).trim().toUpperCase().replace(/\s+/g, '');
    var m = raw.match(/^([A-Z][A-Z0-9]{2})-([A-Z]{1,2})-?(\d{1,6})$/);   // getaggt
    if (m) return { tag: m[1], bare: m[2] + '-' + m[3] };
    m = raw.match(/^([A-Z]{1,2})-?(\d{1,6})$/);                          // nativ
    if (m) return { tag: null, bare: m[1] + '-' + m[2] };
    return null;
  }

  /* ---- Generator der aktuellen Seite ---- */
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
  function outContainers() {
    var cs = [];
    ['gout', 'gen', 'genout', 'ltstack'].forEach(function (id) { var e = document.getElementById(id); if (e) cs.push(e); });
    if (gIn) { var sec = gIn.closest('#generator, section'); if (sec && cs.indexOf(sec) < 0) cs.push(sec); }
    return cs;
  }
  function scrollTarget() {
    var e = byId('gout', 'genout', 'gen', 'ltstack'); if (e) return e;
    return (gIn && (gIn.closest('#generator, section') || gIn)) || null;
  }

  function loadHere(bare) {
    if (!gIn || !gBtn) return false;
    gIn.value = bare; gBtn.click();
    var t = scrollTarget(); if (t && t.scrollIntoView) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(retag, 40); setTimeout(retag, 160);
    return true;
  }

  /* ---- Kürzel auf der Themenseite anzeigen ---- */
  function esc_rx(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function replaceToken(root, bare, tagged) {
    if (!root) return;
    var rx = new RegExp('(^|[^A-Z0-9-])(' + esc_rx(bare) + ')(?![\\dA-Z-])', 'g');
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), nodes = [], n;
    while ((n = w.nextNode())) nodes.push(n);
    nodes.forEach(function (tn) {
      var t = tn.nodeValue;
      if (t.indexOf(bare) < 0) return;
      var nt = t.replace(rx, function (_, pre) { return pre + tagged; });
      if (nt !== t) tn.nodeValue = nt;
    });
  }
  var busy = false;
  function retag() {
    if (busy || !PAGE_TAG || !gIn) return; busy = true;
    try {
      var p = parseCode(gIn.value);
      if (p) {
        var bare = p.bare, tagged = PAGE_TAG + '-' + bare;
        if (!p.tag) gIn.value = tagged;
        outContainers().forEach(function (c) { replaceToken(c, bare, tagged); });
      }
    } catch (e) { }
    busy = false;
  }

  if (gIn && gBtn && PAGE_TAG) {
    var ph = gIn.getAttribute('placeholder');
    if (ph && /^[A-Za-z]-/.test(ph)) gIn.setAttribute('placeholder', PAGE_TAG + '-' + ph);
    // eigenes „Laden" der Seite: getaggte Eingabe akzeptieren
    gBtn.addEventListener('click', function () { var p = parseCode(gIn.value); if (p) gIn.value = p.bare; }, true);
    // nach jeder Generierung nachtaggen
    outContainers().forEach(function (c) {
      try { new MutationObserver(function () { setTimeout(retag, 30); }).observe(c, { childList: true, subtree: true, characterData: true }); } catch (e) { }
    });
    setTimeout(retag, 120);   // anfangs gezeigtes Beispiel
    // Direktlink #ex=…
    var h = location.hash.match(/^#ex=(.+)$/);
    if (h) { var pp = parseCode(decodeURIComponent(h[1])); if (pp) setTimeout(function () { loadHere(pp.bare); }, 100); }
  }

  /* ---- Kopfzeilen-Suche ---- */
  var wrap = document.getElementById('aecp-find');
  var inp = document.getElementById('aecp-find-in');
  var list = document.getElementById('aecp-find-list');
  if (!wrap || !inp || !list) return;

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
    var raw = v.trim(); if (!raw) { close(); return; }
    var p = parseCode(raw);
    if (p && p.tag && byTag[p.tag]) {
      var tp = byTag[p.tag];
      items.push({ kind: 'exnav', label: 'Beispiel ' + p.tag + '-' + p.bare + ' öffnen', meta: tp.t, url: tp.u, bare: p.bare, here: (PAGE_TAG === p.tag) });
    } else if (p && !p.tag && gIn && gBtn && PAGE_TAG) {
      items.push({ kind: 'ex', label: 'Beispiel ' + PAGE_TAG + '-' + p.bare + ' öffnen', meta: 'auf dieser Seite', bare: p.bare });
    }
    topics(raw.toLowerCase()).slice(0, 8).forEach(function (it) {
      items.push({ kind: it.on ? 'go' : 'soon', u: it.u, label: it.t, meta: it.a });
    });
    if (!items.length) {
      var msg = 'Nichts gefunden – anderes Stichwort probieren';
      if (p && p.tag) msg = 'Kürzel „' + p.tag + '“ gibt es nicht – bitte Nummer von der Themenseite verwenden.';
      else if (p) msg = 'Gib die Nummer mit Themen-Kürzel ein, z. B. VLN-M-305 (steht auf der Themenseite).';
      list.innerHTML = '<li class="aecp-find-none" aria-disabled="true">' + esc(msg) + '</li>';
      open(); active = -1; return;
    }
    list.innerHTML = items.map(function (x, i) {
      var cls = 'aecp-find-opt' + (x.kind === 'ex' || x.kind === 'exnav' ? ' is-ex' : '') + (x.kind === 'soon' ? ' is-soon' : '');
      return '<li class="' + cls + '" role="option" data-i="' + i + '"><span class="ti">' + esc(x.label) +
        '</span><span class="ar">' + esc(x.meta) + (x.kind === 'soon' ? ' · in Vorbereitung' : '') + '</span></li>';
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
    if (x.kind === 'ex') { if (loadHere(x.bare)) { close(); inp.blur(); } return; }
    if (x.kind === 'exnav') {
      if (x.here) { if (loadHere(x.bare)) { close(); inp.blur(); } }
      else location.href = x.url + '#ex=' + encodeURIComponent(x.bare);
      return;
    }
    if (x.kind === 'soon') return;
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
