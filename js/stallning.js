// The 2026 Advent standings: hela månaden sammanlagt (lucka 24 och resultatsidan från julafton).
// Samma regel som familjens prisutdelning: flest vunna dagar, sedan flest guld, silver, brons.
// Bara dag 1–23 räknas. "Gav upp" räknas som spelad dag, streck ("–") och ej spelat räknas inte.
//   <script src="../js/stallning.js?v=1"></script>   (efter resultat.js)
//   Advent.Stallning.rita(elem, svar)   svar = Advent.Resultat.alla()
(function () {
  function berakna(svar) {
    var st = {};
    svar.spelare.forEach(function (n) { st[n] = { namn: n, vann: 0, guld: 0, silver: 0, brons: 0, spelade: 0 }; });
    for (var d = 1; d <= 23; d++) {
      var dd = svar.dagar && svar.dagar[d];
      if (!dd || !dd.harSpelat) continue;
      Advent.Resultat.ordna(d, dd, svar.spelare).forEach(function (r) {
        var p = st[r.spelare];
        if (!p || r.status === 'ej' || r.status === 'streck') return;
        p.spelade++;
        if (r.status !== 'klar') return;
        if (r.medalj && p[r.medalj] != null) p[r.medalj]++;
        if (r.plats === 1) p.vann++;
      });
    }
    function jamfor(a, b) { return (b.vann - a.vann) || (b.guld - a.guld) || (b.silver - a.silver) || (b.brons - a.brons); }
    var lista = svar.spelare.map(function (n) { return st[n]; })
      .sort(function (a, b) { return jamfor(a, b) || a.namn.localeCompare(b.namn, 'en'); });
    lista.forEach(function (p, i) { p.plats = (i > 0 && jamfor(lista[i - 1], p) === 0) ? lista[i - 1].plats : i + 1; });
    return lista;
  }

  var STIL = '.stallning{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums;font-size:15px}' +
    '.stallning th{font-size:13px;font-weight:600;color:var(--himmel-dampad);padding:0 4px 8px;text-align:center}' +
    '.stallning th:nth-child(2){text-align:left}' +
    '.stallning td{padding:10px 4px;border-top:1px solid rgba(255,255,255,.14);text-align:center}' +
    '.stallning td.namn{text-align:left;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:9em}' +
    '.stallning td.plats{width:2.2em;color:var(--himmel-dampad);font-weight:700}' +
    '.stallning tr.pall td{font-size:17px;padding:12px 4px}' +
    '.stallning tr.pall td.plats{font-size:20px}' +
    '.stallning tr.jag td{background:rgba(143,211,168,.14)}' +
    '.stallning tr.jag td:first-child{border-radius:8px 0 0 8px}.stallning tr.jag td:last-child{border-radius:0 8px 8px 0}' +
    '.stallning-not{margin:12px 0 0;font-size:13px;color:var(--himmel-dampad)}';

  function el(tagg, klass, text) {
    var e = document.createElement(tagg);
    if (klass) e.className = klass;
    if (text != null) e.textContent = text;
    return e;
  }

  function rita(elem, svar) {
    if (!document.getElementById('stallning-stil')) {
      var s = el('style'); s.id = 'stallning-stil'; s.textContent = STIL; document.head.appendChild(s);
    }
    var jag = Advent.Resultat.namn();
    var tabell = el('table', 'stallning');
    var huvud = el('tr');
    [['', ''], ['', 'Name'], ['🏆', 'Days won'], ['🥇', 'Gold'], ['🥈', 'Silver'], ['🥉', 'Bronze'], ['Played', 'Days played']].forEach(function (k) {
      var th = el('th', null, k[0]);
      if (k[1]) th.setAttribute('aria-label', k[1]);
      th.title = k[1];
      huvud.appendChild(th);
    });
    var thead = el('thead'); thead.appendChild(huvud); tabell.appendChild(thead);
    var kropp = el('tbody');
    berakna(svar).forEach(function (p) {
      var tr = el('tr', (p.plats <= 3 ? 'pall' : '') + (p.namn === jag ? ' jag' : ''));
      tr.appendChild(el('td', 'plats', ['🥇', '🥈', '🥉'][p.plats - 1] || String(p.plats)));
      tr.appendChild(el('td', 'namn', p.namn));
      [p.vann, p.guld, p.silver, p.brons].forEach(function (v) { tr.appendChild(el('td', null, String(v))); });
      tr.appendChild(el('td', null, p.spelade + '/23'));
      kropp.appendChild(tr);
    });
    tabell.appendChild(kropp);
    elem.textContent = '';
    elem.appendChild(tabell);
    elem.appendChild(el('p', 'stallning-not', 'Days 1–23 count. The standings update if someone catches up.'));
  }

  Advent.Stallning = { berakna: berakna, rita: rita };
})();
