// Vilket spel som ligger bakom varje lucka (vängruppens engelska kalender).
// sokvag är relativ till startsidan; ?dag=N läggs till automatiskt.
// lagreArBattre: false om högre poäng vinner på resultattavlan (standard: lägre är bättre, t.ex. tid).
// Lucka 24 (julhälsning och prisutdelning) byggs senare.
window.LUCKOR = {
  1: { titel: 'Snake', sokvag: 'spel/snake/', lagreArBattre: false },
  2: { titel: 'The Wikipedia Game', sokvag: 'spel/wikipedia/' },
  3: { titel: 'Connections', sokvag: 'spel/connections/' },
  4: { titel: 'Guessing Day', sokvag: 'spel/gissning/', lagreArBattre: false },
  5: { titel: 'Globle', sokvag: 'spel/globle/' },
  6: { titel: '2048', sokvag: 'spel/2048/', lagreArBattre: false },
  7: { titel: 'Pattern Day', sokvag: 'spel/monster/', lagreArBattre: false },
  8: { titel: 'Perfect Circle', sokvag: 'spel/perfekt-cirkel/', lagreArBattre: false },
  9: { titel: 'Revealed', sokvag: 'spel/revealed/' },
  10: { titel: 'Minesweeper', sokvag: 'spel/minesweeper/' },
  11: { titel: 'Wikitrivia', sokvag: 'spel/wikitrivia/', lagreArBattre: false },
  12: { titel: 'The Maze', sokvag: 'spel/labyrint/' },
  13: { titel: 'Nerdle', sokvag: 'spel/nerdle/' },
  14: { titel: '15 Puzzle', sokvag: 'spel/femton/' },
  15: { titel: 'Snowflake Catcher', sokvag: 'spel/snoflingor/', lagreArBattre: false },
  16: { titel: 'Codeword', sokvag: 'spel/kodkryss/' },
  17: { titel: 'Memory', sokvag: 'spel/memory/' },
  18: { titel: 'Mini Sudoku', sokvag: 'spel/sudoku/' },
  19: { titel: 'TimeGuessr', sokvag: 'spel/timeguessr/', lagreArBattre: false },
  20: { titel: 'Sense of Time', sokvag: 'spel/tidskanslan/' },
  21: { titel: 'Wordle', sokvag: 'spel/wordle/' },
  22: { titel: 'Simon Says', sokvag: 'spel/simon/', lagreArBattre: false },
  23: { titel: 'Flying Santa', sokvag: 'spel/flygande-tomten/', lagreArBattre: false },
  24: { titel: 'A letter for you', sokvag: 'spel/lucka24/' }
};

// Datumlåset gäller (true öppnar alla luckor).
window.ALLA_OPPNA = false;

// Datumlåset: lucka N öppnas den N:e i den här månaden (telefonens klocka). 11 = december.
window.KALENDER = { ar: 2026, manad: 11 };

// Hur många luckor som är öppna nu: 0 före månaden, dagens datum (högst 24) under månaden, 24 efter.
window.oppnaTill = function (nu) {
  nu = nu || new Date();
  var k = window.KALENDER, ar = nu.getFullYear(), m = nu.getMonth();
  if (ar < k.ar || (ar === k.ar && m < k.manad)) return 0;
  if (ar === k.ar && m === k.manad) return Math.min(nu.getDate(), 24);
  return 24;
};

// Stängd lucka: en spelsida som öppnas före sitt datum (t.ex. via en sparad länk) visar bara ett kort
// med datumet och en väg tillbaka. Spelet körs aldrig: resten av sidan läses in som dold text.
(function () {
  if (window.ALLA_OPPNA) return;
  var sokvag = location.pathname, i = sokvag.indexOf('/spel/');
  if (i === -1) return;
  var q = new URLSearchParams(location.search);
  var dag = parseInt(q.get('dag'), 10);
  if (!(dag >= 1 && dag <= 24)) {
    dag = null;
    for (var n = 1; n <= 24; n++) {
      var l = window.LUCKOR[n];
      if (l && sokvag.slice(i + 1).indexOf(l.sokvag) === 0) { dag = n; break; }
    }
  }
  if (!dag || dag <= window.oppnaTill()) return;
  // Resten av sidan (spelets HTML och skript) blir till dold text och körs aldrig.
  if (document.readyState === 'loading') document.write('<plaintext hidden style="display:none">');
  var rot = sokvag.slice(0, i + 1);
  var datum = new Date(window.KALENDER.ar, window.KALENDER.manad, dag)
    .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  function visa() {
    document.documentElement.lang = 'en';
    document.title = 'Day ' + dag + ' is locked';
    document.body.innerHTML = '';
    var main = document.createElement('main');
    main.className = 'spalt';
    main.innerHTML = '<a class="tillbaka" href="' + rot + '">← Calendar</a>' +
      '<div class="kort stangd-lucka" style="text-align:center;padding:28px 20px;margin-top:24px">' +
      '<p style="font-size:44px;margin:0 0 6px" aria-hidden="true">🔒</p>' +
      '<h1 style="font-size:24px;margin:0 0 8px">Day ' + dag + ' isn’t open yet.</h1>' +
      '<p style="margin:0 0 20px">It opens on ' + datum + '.</p>' +
      '<a class="knapp" href="' + rot + '">Back to the calendar</a></div>';
    document.body.appendChild(main);
  }
  document.addEventListener('DOMContentLoaded', visa);
})();
