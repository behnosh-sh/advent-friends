// Vängruppens gemensamma resultat. Pratar med Apps Script-webbappen i google/resultat.gs.
// Ladda efter gemensam.js och luckor.js:
//   <script src="../../js/resultat.js"></script>
//
// Ett spel gör så här:
//   Advent.Resultat.tavla(elem, dag, { vidStatus: function (d) { ... }, sparNyckel })  visar kodruta, låst tavla eller dagens tavla
//     sparNyckel (valfri, sträng eller lista): där spelet sparar dagens omgång med skickad: true. Har resultatet
//     tagits bort ur arket töms de nycklarna och sidan laddas om, så att man kan spela om.
//   Advent.Resultat.skicka({ dag, spel, status: 'klar' | 'gav upp', varde, medalj, text })  skickar och uppdaterar tavlan
// varde är talet som tavlan sorteras på (t.ex. sekunder). text är det som visas, t.ex. "1:42" eller "5 klick · 1:12".
// Om lägre eller högre är bättre står i js/luckor.js (lagreArBattre, standard true).
(function () {
  // Webbappens adress från Apps Script (Distribuera > Hantera distributioner). Den är inte hemlig.
  var ADRESS = 'https://script.google.com/macros/s/AKfycbx2q55_Uk0SruCz6efiEBDJNeVwku1iJyUIIi8Rm8wMp83mh8oLskfnd_nf7naXzfGe4Q/exec';

  var KOD_NYCKEL = 'advent-kod';
  var NAMN_NYCKEL = 'advent-namn';
  var SPELARE_NYCKEL = 'advent-spelare';   // senaste listan med namn från arket, om arket inte svarar senare
  var MEDALJ_EMOJI = { guld: '🥇', silver: '🥈', brons: '🥉' };
  var MEDALJ_NAMN = { guld: 'Gold', silver: 'Silver', brons: 'Bronze' };

  var monterade = [];
  var senaste = null;   // { tid, ok, fel } för lägesraden

  function arInkopplad() { return !!ADRESS; }
  function kod() { return Advent.lasa(KOD_NYCKEL, null); }
  function namn() { return Advent.lasa(NAMN_NYCKEL, null); }

  function anrop(atgard, data) {
    if (!arInkopplad()) return Promise.reject(new Error('The scoreboard isn’t connected yet.'));
    var kropp = { atgard: atgard, kod: (data && data.kod) || kod() };
    for (var k in data) if (k !== 'kod') kropp[k] = data[k];
    // Utan kod frågar telefonen aldrig arket (en tom kod får inte räknas som en felaktig kod).
    if (!kropp.kod) return Promise.reject(new Error('This phone isn’t signed in.'));
    return skickaAnrop(kropp);
  }

  function skickaAnrop(kropp) {
    return fetch(ADRESS, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(kropp)
    })
      .then(function (r) { return r.json(); }, function () { throw new Error('Couldn’t reach the scoreboard. Are you online?'); })
      .then(function (svar) {
        if (!svar.ok) {
          if (svar.fel === 'That code isn’t right.' || svar.fel === 'The code should be 4 digits.') glomKod();
          throw new Error(svar.fel || 'Something went wrong.');
        }
        if (svar.namn) Advent.spara(NAMN_NYCKEL, svar.namn);
        if (svar.spelare && svar.spelare.length) Advent.spara(SPELARE_NYCKEL, svar.spelare);
        senaste = { tid: Date.now(), ok: true };
        return svar;
      })
      .catch(function (fel) {
        senaste = { tid: Date.now(), ok: false, fel: fel.message };
        throw fel;
      });
  }

  function glomKod() {
    Advent.spara(KOD_NYCKEL, null);
    Advent.spara(NAMN_NYCKEL, null);
    document.dispatchEvent(new Event('advent-utloggad'));
  }

  function spelare() { return Advent.lasa(SPELARE_NYCKEL, null); }

  function loggaIn(nyKod) {
    return anrop('vem', { kod: nyKod }).then(function (svar) {
      Advent.spara(KOD_NYCKEL, nyKod);
      document.dispatchEvent(new Event('advent-inloggad'));
      return svar;
    });
  }

  function hamta(dag) { return anrop('hamta', { dag: dag }); }
  function alla() { return anrop('alla', {}); }

  function skicka(resultat) {
    return anrop('skicka', resultat).then(function (svar) {
      monterade.forEach(function (m) { if (m.dag === resultat.dag) rita(m, svar); });
      return svar;
    });
  }

  function lagreArBattre(dag) {
    var l = window.LUCKOR && window.LUCKOR[dag];
    return !(l && l.lagreArBattre === false);
  }

  // Klara först (bäst först), sedan de som gett upp, sedan de som inte spelat.
  function ordna(dag, dagdata, spelare) {
    var lagre = lagreArBattre(dag);
    var rader = (dagdata.rader || []).slice();
    var klara = rader.filter(function (r) { return r.status === 'klar'; })
      .sort(function (a, b) { return lagre ? a.varde - b.varde : b.varde - a.varde; });
    var gavUpp = rader.filter(function (r) { return r.status !== 'klar'; });
    var spelat = rader.map(function (r) { return r.spelare; });
    var ejSpelat = (spelare || []).filter(function (n) { return spelat.indexOf(n) === -1; })
      .map(function (n) { return { spelare: n, status: 'ej' }; });
    var plats = 0, forra = null;
    klara.forEach(function (r, i) {
      if (r.varde !== forra) plats = i + 1;
      forra = r.varde;
      r.plats = plats;
    });
    return klara.concat(gavUpp, ejSpelat);
  }

  function el(tagg, klass, text) {
    var e = document.createElement(tagg);
    if (klass) e.className = klass;
    if (text != null) e.textContent = text;
    return e;
  }

  function medaljBricka(medalj) {
    var b = el('span', 'medalj' + (medalj ? ' ' + medalj : ' ingen'), MEDALJ_EMOJI[medalj] || '');
    if (medalj) b.setAttribute('aria-label', MEDALJ_NAMN[medalj]);
    else b.setAttribute('aria-hidden', 'true');
    return b;
  }

  // Ritar dagens rader i en lista. Används både i luckorna och på resultatsidan.
  function ritaRader(lista, dag, dagdata, spelare, jag) {
    lista.textContent = '';
    var rader = ordna(dag, dagdata, spelare);
    // Spel utan medaljer visas utan medaljkolumn.
    lista.classList.toggle('utan-medalj', !rader.some(function (r) { return r.medalj; }));
    rader.forEach(function (r) {
      var rad = el('li', 'tavla-rad' + (r.spelare === jag ? ' jag' : '') + (r.status === 'ej' ? ' vantar' : ''));
      rad.appendChild(el('span', 'plats', r.plats ? String(r.plats) : ''));
      rad.appendChild(r.status === 'ej' ? el('span', 'medalj') : medaljBricka(r.status === 'klar' ? r.medalj : ''));
      rad.appendChild(el('span', 'vem', r.spelare));
      // 'streck': en dag som Behnosh inte kan spela (hennes resultat kopieras från familjens kalender).
      rad.appendChild(el('span', 'hur', r.status === 'ej' ? 'not yet' : r.status === 'klar' ? r.text : r.status === 'streck' ? '–' : 'gave up'));
      lista.appendChild(rad);
    });
  }

  function ritaLast(ruta, dagdata, spelare) {
    var totalt = (spelare || []).length || 6;
    ruta.appendChild(el('p', 'tavla-info', dagdata.antal + ' of ' + totalt + ' have played. Send your result to see everyone else’s.'));
  }

  function ritaKodruta(m) {
    var ruta = m.innehall;
    ruta.textContent = '';
    ruta.appendChild(el('p', 'tavla-info', 'Enter your personal code once and this phone will remember you.'));
    var form = el('form', 'tavla-kod');
    var etikett = el('label', null, 'Your code');
    var inmatning = el('input');
    var id = 'kod-' + Math.random().toString(36).slice(2, 8);
    etikett.htmlFor = id;
    inmatning.id = id;
    inmatning.type = 'password';
    inmatning.inputMode = 'numeric';
    inmatning.autocomplete = 'off';
    inmatning.maxLength = 4;
    var knapp = el('button', 'knapp', 'Save');
    knapp.type = 'submit';
    var meddelande = el('p', 'tavla-fel');
    form.appendChild(etikett);
    form.appendChild(inmatning);
    form.appendChild(knapp);
    ruta.appendChild(form);
    ruta.appendChild(meddelande);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = inmatning.value.trim();
      if (!v) return;
      if (!/^\d{4}$/.test(v)) { meddelande.textContent = 'The code should be 4 digits.'; return; }
      knapp.disabled = true;
      meddelande.textContent = '';
      loggaIn(v).then(function () { ladda(m); }, function (fel) {
        knapp.disabled = false;
        meddelande.textContent = fel.message;
      });
    });
  }

  // Telefonen säger att dagens resultat är skickat men tavlan säger att man inte har spelat:
  // raden har tagits bort ur arket. Då töms spelets sparade omgång och sidan laddas om.
  function borttaget(m, dagdata) {
    if (!m.sparNycklar.length || !dagdata || dagdata.harSpelat) return false;
    var skickat = m.sparNycklar.some(function (k) { var v = Advent.lasa(k, null); return v && v.skickad; });
    if (!skickat) return false;
    m.sparNycklar.forEach(function (k) { Advent.spara(k, null); });
    location.reload();
    return true;
  }

  function rita(m, svar) {
    if (borttaget(m, svar.dag)) return;
    var ruta = m.innehall;
    ruta.textContent = '';
    if (svar.dag.harSpelat) {
      var lista = el('ol', 'tavla-lista');
      ritaRader(lista, m.dag, svar.dag, svar.spelare, svar.namn);
      ruta.appendChild(lista);
    } else {
      ritaLast(ruta, svar.dag, svar.spelare);
    }
    // Vem man är och "Byt person" finns på resultatsidan.
    if (m.vidStatus) m.vidStatus(svar.dag, svar);
  }

  function ladda(m) {
    if (!arInkopplad()) {
      m.innehall.textContent = '';
      m.innehall.appendChild(el('p', 'tavla-info', 'The scoreboard isn’t connected yet.'));
      if (m.vidStatus) m.vidStatus(null);
      return;
    }
    if (!kod()) {
      ritaKodruta(m);
      if (m.vidStatus) m.vidStatus(null);
      return;
    }
    m.innehall.textContent = '';
    m.innehall.appendChild(el('p', 'tavla-info', 'Loading…'));
    hamta(m.dag).then(function (svar) { rita(m, svar); }, function (fel) {
      if (!kod()) { ritaKodruta(m); return; }
      m.innehall.textContent = '';
      m.innehall.appendChild(el('p', 'tavla-fel', fel.message));
    });
  }

  // Lägger dagens tavla i elem. vidStatus(dagdata) anropas när det är klart om man har spelat
  // (dagdata.harSpelat), eller med null om personen inte är inloggad.
  function tavla(elem, dag, val) {
    elem.classList.add('tavla', 'kort');
    elem.textContent = '';
    elem.appendChild(el('h2', null, 'Today’s scoreboard'));
    var innehall = el('div');
    elem.appendChild(innehall);
    var nycklar = val && val.sparNyckel;
    var m = { dag: dag, innehall: innehall, vidStatus: val && val.vidStatus, sparNycklar: nycklar ? [].concat(nycklar) : [] };
    monterade.push(m);
    ladda(m);
    return m;
  }

  Advent.Resultat = {
    arInkopplad: arInkopplad,
    kod: kod,
    namn: namn,
    loggaIn: loggaIn,
    glomKod: glomKod,
    hamta: hamta,
    alla: alla,
    skicka: skicka,
    tavla: tavla,
    ritaRader: ritaRader,
    ordna: ordna,
    medaljBricka: medaljBricka,
    spelare: spelare,
    senaste: function () { return senaste; }
  };
})();
