// Gemensam kod för startsidan och alla spel (vängruppens engelska kalender).
// Ladda med <script src="../../js/gemensam.js"></script> från spel/<namn>/index.html.
(function () {
  // Bytt 2026-11-20 (nedlåsningen), så att banorna i december inte är de som provades under bygget.
  var FRO_PREFIX = 'advent-2026-2d688d1c3ab1-dag-';

  // Allt som sparas i telefonen får prefixet LAGRING_PREFIX, så att vännernas kalender aldrig
  // krockar med familjens (samma adress behnosh-sh.github.io delar lagringen).
  var LAGRING_PREFIX = 'friends:';

  // Dag 1–24 från ?dag=N. Saknas eller fel värde blir det null.
  function hamtaDag() {
    var n = parseInt(new URLSearchParams(location.search).get('dag'), 10);
    return n >= 1 && n <= 24 ? n : null;
  }

  // Dagens frösträng: FRO_PREFIX + dagens nummer.
  function froForDag(dag) {
    return FRO_PREFIX + dag;
  }

  // Gör om en sträng till ett 32-bitars tal (cyrb53-varianten, stabil i alla webbläsare).
  function hashStrang(str) {
    var h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ c, 2654435761);
      h2 = Math.imul(h2 ^ c, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (h2 ^ h1) >>> 0;
  }

  // Slumpgenerator (mulberry32) som ger samma följd för samma frö. Returnerar tal i [0, 1).
  function skapaSlump(fro) {
    var a = typeof fro === 'number' ? fro >>> 0 : hashStrang(String(fro));
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Slump för dagens tävlingsrunda: samma för alla i familjen.
  function dagensSlump(dag) {
    return skapaSlump(froForDag(dag));
  }

  // Slump för "Spela igen": ny varje gång.
  function nySlump() {
    return skapaSlump(Math.floor(Math.random() * 4294967296));
  }

  // Formaterar sekunder som 3:07 eller 1:02:07.
  function formateraTid(sek) {
    sek = Math.max(0, Math.round(sek));
    var h = Math.floor(sek / 3600), m = Math.floor((sek % 3600) / 60), s = sek % 60;
    var ss = (s < 10 ? '0' : '') + s;
    return h ? h + ':' + (m < 10 ? '0' : '') + m + ':' + ss : m + ':' + ss;
  }

  // localStorage som tål privata fönster och blockerad lagring.
  function lasa(nyckel, standard) {
    try {
      var v = localStorage.getItem(LAGRING_PREFIX + nyckel);
      return v === null ? standard : JSON.parse(v);
    } catch (e) { return standard; }
  }
  function spara(nyckel, varde) {
    try { localStorage.setItem(LAGRING_PREFIX + nyckel, JSON.stringify(varde)); } catch (e) { /* ignorera */ }
  }

  // Engångsrensning: första gången en sida öppnas från 1 december glömmer telefonen allt som sparats om
  // luckorna under bygget (spelade luckor, banor, skickat, öppnade luckor, kassaskåpet).
  // Inloggningen (advent-kod, advent-namn) och namnlistan (advent-spelare) ligger kvar. Arket rörs inte.
  // Bara vännernas egna nycklar (med LAGRING_PREFIX) tas bort; familjens kalender rörs aldrig.
  var RENSA_FRAN = new Date(2026, 11, 1).getTime();
  var RENSAD_NYCKEL = 'advent-rensad-dec-2026';
  var RENSA_PREFIX = ['2048:', 'cirkel:', 'connections:', 'femton:', 'flygande-tomten:', 'gissning:', 'kodkryss:',
    'labyrint:', 'memory:', 'monster:', 'simon:', 'snake:', 'snoflingor:', 'sudoku:', 'tidskanslan:', 'wordle:',
    'minesweeper', 'advent-oppnade'];
  function rensaFranBygget() {
    if (Date.now() < RENSA_FRAN || lasa(RENSAD_NYCKEL, false) === true) return;
    try {
      var bort = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && RENSA_PREFIX.some(function (p) { return k.indexOf(LAGRING_PREFIX + p) === 0; })) bort.push(k);
      }
      bort.forEach(function (k) { localStorage.removeItem(k); });
    } catch (e) { /* ignorera */ }
    spara(RENSAD_NYCKEL, true);
  }
  rensaFranBygget();

  // Markerar en lucka som öppnad (granen visas "vänd" på startsidan).
  function markeraOppnad(dag) {
    var lista = lasa('advent-oppnade', []);
    if (lista.indexOf(dag) === -1) { lista.push(dag); spara('advent-oppnade', lista); }
  }

  // Egen fråga-ruta i kalenderns stil i stället för confirm(). Ger ett Promise med true/false.
  // Advent.fraga({ rubrik, text, ja, nej }).then(function (ok) { ... });
  function fraga(o) {
    return new Promise(function (svara) {
      var bak = document.createElement('div');
      bak.className = 'fragaruta-bakgrund';
      var ruta = document.createElement('div');
      ruta.className = 'fragaruta';
      ruta.setAttribute('role', 'alertdialog');
      ruta.setAttribute('aria-modal', 'true');
      var h = document.createElement('h2');
      h.textContent = o.rubrik;
      ruta.appendChild(h);
      if (o.text) { var t = document.createElement('p'); t.textContent = o.text; ruta.appendChild(t); }
      var ja = document.createElement('button');
      ja.type = 'button';
      ja.className = 'knapp';
      ja.textContent = o.ja || 'Yes';
      var nej = document.createElement('button');
      nej.type = 'button';
      nej.className = 'knapp ljus';
      nej.textContent = o.nej || 'Cancel';
      ruta.appendChild(ja);
      ruta.appendChild(nej);
      bak.appendChild(ruta);
      function klar(svar) {
        document.removeEventListener('keydown', tangent, true);
        bak.remove();
        svara(svar);
      }
      function tangent(e) {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); klar(false); }
        else e.stopPropagation();   // spelets tangenter ska inte reagera medan rutan är öppen
      }
      ja.addEventListener('click', function () { klar(true); });
      nej.addEventListener('click', function () { klar(false); });
      bak.addEventListener('click', function (e) { if (e.target === bak) klar(false); });
      document.addEventListener('keydown', tangent, true);
      document.body.appendChild(bak);
      nej.focus();
    });
  }

  // Pausar spelets klocka när sidan inte syns (annan flik, annan app, låst skärm, stängd sida).
  // Under pausen täcker en ruta hela sidan så att man inte kan klura i smyg; klockan går
  // igen först när man trycker Fortsätt. Spelet berättar hur klockan flyttas:
  // Advent.pausKlocka({
  //   gar: function () { return true när klockan går just nu },
  //   flytta: function (ms) { flytta fram starttiden ms millisekunder och spara },
  //   nyckel: function () { return sparnyckel för dagens spel, eller null i övningsläge }
  // });
  // Pausens starttid sparas i telefonen, så att klockan står still även om sidan stängs.
  var paus = null;   // { o, start, bak }
  function pausNyckel(o) { var n = o.nyckel && o.nyckel(); return n ? 'paus:' + n : null; }

  function visaPaus() {
    var bak = document.createElement('div');
    bak.className = 'fragaruta-bakgrund paus-bakgrund';
    var ruta = document.createElement('div');
    ruta.className = 'fragaruta';
    ruta.setAttribute('role', 'alertdialog');
    ruta.setAttribute('aria-modal', 'true');
    var h = document.createElement('h2');
    h.textContent = 'Paused';
    var t = document.createElement('p');
    t.textContent = 'The clock stops while you’re away. It starts again when you tap Continue.';
    var knapp = document.createElement('button');
    knapp.type = 'button';
    knapp.className = 'knapp';
    knapp.textContent = 'Continue';
    knapp.addEventListener('click', fortsattPaus);
    ruta.appendChild(h);
    ruta.appendChild(t);
    ruta.appendChild(knapp);
    bak.appendChild(ruta);
    document.body.appendChild(bak);
    knapp.focus();
    return bak;
  }

  // Spelets tangenter ska inte reagera under pausen (Enter/mellanslag på Fortsätt går igenom).
  document.addEventListener('keydown', function (e) {
    if (!paus) return;
    if ((e.key === 'Enter' || e.key === ' ') && e.target && e.target.closest && e.target.closest('.paus-bakgrund')) return;
    e.preventDefault();
    e.stopPropagation();
  }, true);

  function startaPaus(o, start) {
    if (paus) return;
    paus = { o: o, start: start, bak: visaPaus() };
    var n = pausNyckel(o);
    if (n) spara(n, start);
  }

  function fortsattPaus() {
    if (!paus) return;
    var p = paus;
    paus = null;
    p.bak.remove();
    var n = pausNyckel(p.o);
    if (n) { try { localStorage.removeItem(LAGRING_PREFIX + n); } catch (e) { /* ignorera */ } }
    if (p.o.gar()) p.o.flytta(Math.max(0, Date.now() - p.start));
  }

  // Kan anropas igen (t.ex. när spelet laddat dagens läge), lyssnaren läggs bara till en gång.
  var pausSpel = null;
  function pausKlocka(o) {
    var forsta = !pausSpel;
    pausSpel = o;
    // Pausad när sidan stängdes förra gången?
    var n = pausNyckel(o), sparad = n && lasa(n, null);
    if (sparad && o.gar()) startaPaus(o, Math.min(sparad, Date.now()));
    else if (n && sparad) { try { localStorage.removeItem(LAGRING_PREFIX + n); } catch (e) { /* ignorera */ } }
    if (forsta) document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden' && pausSpel.gar()) startaPaus(pausSpel, Date.now());
    });
  }

  // Klockslaget spelets klocka står på: när pausen började medan pausrutan visas, annars nu.
  // Spel med nedräkning räknar med den, så att tiden inte tar slut under pausen.
  function klockaNu() { return paus ? paus.start : Date.now(); }

  window.Advent = {
    FRO_PREFIX: FRO_PREFIX,
    LAGRING_PREFIX: LAGRING_PREFIX,
    hamtaDag: hamtaDag,
    froForDag: froForDag,
    hashStrang: hashStrang,
    skapaSlump: skapaSlump,
    dagensSlump: dagensSlump,
    nySlump: nySlump,
    formateraTid: formateraTid,
    lasa: lasa,
    spara: spara,
    markeraOppnad: markeraOppnad,
    fraga: fraga,
    pausKlocka: pausKlocka,
    klockaNu: klockaNu,
    // Mästarprovet (familjens lucka 24) finns inte här. Spelen frågar fortfarande, så de får alltid "nej".
    Prov: { aktiv: false, runda: function () {} }
  };
})();
