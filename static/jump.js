/* NWT · Beispiel-Suche in der Titelleiste.
   Erkennt den Generator der Seite und springt beim Absenden zum passenden Beispiel.
   Funktioniert nur auf Generator-Seiten; sonst bleibt das Feld versteckt. */
(function () {
  'use strict';
  var form = document.getElementById('aecp-find');
  if (!form) return;
  var fin = document.getElementById('aecp-find-in');

  function byId() { for (var i = 0; i < arguments.length; i++) { var e = document.getElementById(arguments[i]); if (e) return e; } return null; }

  function findInput() {
    var e = byId('gcode', 'gencode', 'ltcode');
    if (e) return e;
    // Fallback: Eingabefeld mit Code-Platzhalter (z. B. "M-123", "X-4711")
    var cand = document.querySelectorAll('#generator input[placeholder], .genbar input[placeholder], .gen input[placeholder]');
    for (var i = 0; i < cand.length; i++) if (/^[A-Za-z]\s*-?\s*\d/.test(cand[i].getAttribute('placeholder') || '')) return cand[i];
    return null;
  }
  function findButton(input) {
    var b = byId('gload', 'genload');
    if (b) return b;
    if (!input) return null;
    var box = input.closest('.genbar, #generator, .gen, section') || document;
    var bs = box.querySelectorAll('button');
    for (var i = 0; i < bs.length; i++) if (/laden/i.test(bs[i].textContent)) return bs[i];
    return null;
  }

  var input = findInput();
  var btn = findButton(input);
  if (!input || !btn) return;            // keine Generator-Seite -> Feld bleibt aus

  form.hidden = false;
  form.classList.add('on');

  function target() {
    return byId('gout', 'genout') ||
      (input.closest('#generator, section')) || input;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = fin.value.trim();
    if (!v) { fin.focus(); return; }
    input.value = v;
    btn.click();
    var t = target();
    if (t && t.scrollIntoView) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
})();
