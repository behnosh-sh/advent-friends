/** @OnlyCurrentDoc */
// Vängruppens adventskalender (engelska): resultat i ett eget privat Google Sheet.
// Samma script som familjens, utan repetitionen, med engelska felmeddelanden och Behnoshs kopierade rader.
// Klistras in i arkets Apps Script (Tillägg > Apps Script) och publiceras som webbapp:
//   Kör som: Jag   Åtkomst: Alla
// Arket delas aldrig. Koderna ligger i fliken "Spelare" i arket, aldrig i det publika repot.
//
// Flikar som scriptet använder (skapas av installera() om de saknas):
//   Spelare:  Namn | Kod
//   Resultat: Tidsstämpel | Dag | Spel | Spelare | Status | Värde | Medalj | Text
//   Familjen: Behnoshs rader från familjens ark, samma kolumner. Behnosh klistrar in dem själv när hon vill
//             (kopiera hennes rader ur familjens flik Resultat, som de är, på svenska). Inget script eller
//             någon formel kommer åt familjens ark; det här scriptet läser bara fliken.
//
// Behnosh spelar bara familjens kalender. Hennes jämförbara dagar läses från fliken Familjen (texten görs om
// till engelska), och dagar som inte går att jämföra (STRECK_DAGAR) får en rad "–" åt henne. Hon kan aldrig
// skicka något själv här, men ser tavlorna som alla andra.

var FLIK_SPELARE = 'Spelare';
var FLIK_RESULTAT = 'Resultat';
var FLIK_FAMILJEN = 'Familjen';
var BEHNOSH = 'Behnosh';            // namnet i fliken Spelare (och i familjens ark)
var STRECK_DAGAR = [7, 16, 21];     // Mönsterdagen, Kodkryss, Wordle: annat innehåll än familjens
var MAX_FEL_PER_TIMME = 10;
var MAX_FEL_JULAFTON = 50;   // 24–26 december
var STATUSAR = ['klar', 'gav upp'];
var MEDALJER = ['', 'guld', 'silver', 'brons'];
var KOLUMNER = ['Tidsstämpel', 'Dag', 'Spel', 'Spelare', 'Status', 'Värde', 'Medalj', 'Text'];

// Kör en gång från redigeraren för att skapa flikarna.
function installera() {
  var ark = SpreadsheetApp.getActiveSpreadsheet();
  if (!ark.getSheetByName(FLIK_SPELARE)) {
    var s = ark.insertSheet(FLIK_SPELARE);
    s.appendRow(['Namn', 'Kod']);
    s.getRange('B:B').setNumberFormat('@');
    [BEHNOSH, 'Friend 1', 'Friend 2', 'Friend 3', 'Friend 4', 'Friend 5'].forEach(function (namn) { s.appendRow([namn, '']); });
  }
  if (!ark.getSheetByName(FLIK_RESULTAT)) ark.insertSheet(FLIK_RESULTAT).appendRow(KOLUMNER);
  if (!ark.getSheetByName(FLIK_FAMILJEN)) ark.insertSheet(FLIK_FAMILJEN).appendRow(KOLUMNER);
}

// Sidan skickar allt som POST med JSON i kroppen (text/plain, så att webbläsaren inte gör en förfrågan i förväg).
function doPost(e) {
  var svar;
  try {
    var in_ = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    svar = hantera(in_);
  } catch (fel) {
    var saknas = fel && /^The .* tab is missing/.test(String(fel.message));
    svar = { ok: false, fel: saknas ? String(fel.message) : 'Something went wrong in the script.' };
  }
  return ContentService.createTextOutput(JSON.stringify(svar)).setMimeType(ContentService.MimeType.JSON);
}

function hantera(in_) {
  var spelare = hamtaSpelare();
  var jag = vemArDet(in_.kod, spelare);
  if (jag.fel) return { ok: false, fel: jag.fel };
  var namnen = spelare.map(function (s) { return s.namn; });

  if (in_.atgard === 'vem') {
    return { ok: true, namn: jag.namn, spelare: namnen };
  }
  if (in_.atgard === 'hamta') {
    var dag = giltigDag(in_.dag);
    if (!dag) return { ok: false, fel: 'Wrong day.' };
    return { ok: true, namn: jag.namn, spelare: namnen, dag: tavlaForDag(dag, jag.namn, lasResultat()) };
  }
  if (in_.atgard === 'alla') {
    var alla = lasResultat(), dagar = {}, allt = arJulafton();
    for (var d = 1; d <= 24; d++) dagar[d] = tavlaForDag(d, jag.namn, alla, allt);
    return { ok: true, namn: jag.namn, spelare: namnen, dagar: dagar };
  }
  if (in_.atgard === 'skicka') {
    if (jag.namn === BEHNOSH) return { ok: false, fel: 'Behnosh’s results are copied from the family calendar.' };
    return skicka(in_, jag.namn, namnen);
  }
  return { ok: false, fel: 'Unknown action.' };
}

function skicka(in_, namn, namnen) {
  var dag = giltigDag(in_.dag);
  var spel = kortText(in_.spel, 40);
  var status = STATUSAR.indexOf(in_.status) !== -1 ? in_.status : null;
  var medalj = MEDALJER.indexOf(in_.medalj || '') !== -1 ? (in_.medalj || '') : null;
  var text = kortText(in_.text, 200);
  var varde = status === 'klar' ? Number(in_.varde) : '';
  if (!dag || !spel || !status || medalj === null) return { ok: false, fel: 'That result looks odd.' };
  if (status === 'klar' && !(isFinite(varde) && varde >= 0 && varde < 1e9)) return { ok: false, fel: 'That result looks odd.' };

  var las = LockService.getScriptLock();
  las.waitLock(10000);
  try {
    var alla = lasResultat();
    var redan = alla.some(function (r) { return r.dag === dag && r.spelare === namn; });
    if (!redan) {
      arket(FLIK_RESULTAT).appendRow([new Date(), dag, skyddaCell(spel), namn, status, varde, medalj, skyddaCell(text)]);
      alla = lasResultat();
    }
    return { ok: true, redanSkickat: redan, namn: namn, spelare: namnen, dag: tavlaForDag(dag, namn, alla) };
  } finally {
    las.releaseLock();
  }
}
// Från julafton (24–31 december, svensk tid) visas hela året för alla, så att
// prisutdelningen i lucka 24 räknar likadant på varje telefon.
function arJulafton() {
  return Utilities.formatDate(new Date(), 'Europe/Stockholm', 'MM-dd') >= '12-24';
}

// Andras resultat lämnas bara ut till den som själv har skickat in för dagen, utom från julafton
// (allt = true, bara i hela årets lista).
function tavlaForDag(dag, namn, alla, allt) {
  var rader = alla.filter(function (r) { return r.dag === dag; });
  var harSpelat = allt || rader.some(function (r) { return r.spelare === namn; });
  if (!harSpelat) return { harSpelat: false, antal: rader.length };
  return {
    harSpelat: true,
    antal: rader.length,
    rader: rader.map(function (r) {
      return { spelare: r.spelare, status: r.status, varde: r.varde, medalj: r.medalj, text: r.text, tid: r.tid };
    })
  };
}

// En tom kod (telefonen är inte inloggad) räknas inte som ett fel och väntar inte.
function vemArDet(kod, spelare) {
  kod = rensaKod(kod);
  if (!kod) return { fel: 'This phone isn’t signed in.' };
  var cache = CacheService.getScriptCache();
  var fel = Number(cache.get('fel') || 0);
  if (fel >= maxFel()) return { fel: 'Too many wrong codes. Wait an hour and try again.' };
  var traff = spelare.filter(function (s) { return s.kod === kod; })[0];
  if (!traff) {
    cache.put('fel', String(fel + 1), 3600);
    Utilities.sleep(1500);
    return { fel: 'That code isn’t right.' };
  }
  return { namn: traff.namn };
}

function maxFel() {
  var d = Utilities.formatDate(new Date(), 'Europe/Stockholm', 'MM-dd');
  return d >= '12-24' && d <= '12-26' ? MAX_FEL_JULAFTON : MAX_FEL_PER_TIMME;
}

function hamtaSpelare() {
  var v = arket(FLIK_SPELARE).getDataRange().getValues().slice(1);
  return v.filter(function (r) { return r[0] && rensaKod(r[1]); })
    .map(function (r) { return { namn: String(r[0]).trim(), kod: rensaKod(r[1]) }; });
}

// Alla rader som tavlorna visar: vännernas egna (fliken Resultat), Behnoshs kopierade rader för jämförbara
// dagar (fliken Familjen) och en rad "–" åt henne för STRECK_DAGAR.
function lasResultat() {
  var egna = lasFlik(FLIK_RESULTAT).filter(function (r) { return r.spelare !== BEHNOSH; });
  var familjen = [];
  var flik = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(FLIK_FAMILJEN);
  if (flik) {
    familjen = lasFlik(FLIK_FAMILJEN).filter(function (r) {
      return r.spelare === BEHNOSH && giltigDag(r.dag) && STRECK_DAGAR.indexOf(r.dag) === -1;
    });
    familjen.forEach(function (r) { r.text = engelskText(r.text); });
  }
  var streck = STRECK_DAGAR.map(function (d) {
    return { tid: '', dag: d, spel: '', spelare: BEHNOSH, status: 'streck', varde: null, medalj: '', text: '–' };
  });
  return egna.concat(familjen, streck);
}

function lasFlik(namn) {
  var v = arket(namn).getDataRange().getValues().slice(1);
  return v.map(function (r) {
    return {
      tid: r[0] instanceof Date ? r[0].toISOString() : String(r[0]),
      dag: Number(r[1]), spel: String(r[2]), spelare: String(r[3]), status: String(r[4]),
      varde: r[5] === '' ? null : Number(r[5]), medalj: String(r[6]), text: String(r[7])
    };
  });
}

// Familjens resultattext på svenska blir samma engelska som vännernas spel skriver,
// t.ex. "längd 13 · 0:39,5" → "length 13 · 0:39.5" och "9 807 p · största 512" → "9,807 pts · largest 512".
var ORD = [
  [/klarade inte/g, 'didn’t solve it'], [/kort rätt/g, 'cards right'], [/i rad/g, 'in a row'],
  [/längd/g, 'length'], [/klick/g, 'clicks'], [/\bbom\b/g, 'misses'],
  [/gissningar/g, 'guesses'], [/\b1 gissning\b/g, '1 guess'], [/gissning/g, 'guesses'],
  [/största/g, 'largest'], [/\b1 ledtråd\b/g, '1 hint'], [/ledtrådar|ledtråd/g, 'hints'],
  [/\b1 ord\b/g, '1 word'], [/\bord\b/g, 'words'], [/\bdrag\b/g, 'moves'],
  [/\b1 poäng\b/g, '1 point'], [/poäng/g, 'points'], [/ s fel\b/g, ' s off'],
  [/\b1 skorsten\b/g, '1 chimney'], [/skorstenar|skorsten/g, 'chimneys'],
  [/(\d) p\b/g, '$1 pts'], [/(\d) %/g, '$1%'], [/\bav\b/g, 'of']
];
function engelskText(t) {
  t = String(t || '')
    .replace(/(\d),(?=\d)/g, '$1.')                      // decimaler: "46,2" → "46.2"
    .replace(/(\d)[\u00a0\u202f ](?=\d{3}\b)/g, '$1,');  // tusental: "9 807" → "9,807"
  ORD.forEach(function (o) { t = t.replace(o[0], o[1]); });
  return t;
}

function arket(namn) {
  var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(namn);
  if (!s) throw new Error('The ' + namn + ' tab is missing. Run installera().');
  return s;
}

// Koder jämförs som text. Ett tal som 123 blir "0123" om arket har tagit bort nollan först.
function rensaKod(k) {
  k = String(k == null ? '' : k).trim();
  if (/^\d{1,3}$/.test(k)) k = ('0000' + k).slice(-4);
  return /^\d{4,8}$/.test(k) ? k : '';
}

function giltigDag(d) {
  d = Number(d);
  return d >= 1 && d <= 24 && Math.floor(d) === d ? d : null;
}

function kortText(t, max) {
  t = String(t == null ? '' : t).replace(/[\u0000-\u0009\u000B-\u001F]/g, '').trim();
  return t ? t.slice(0, max) : '';
}

// Text som börjar med = + - @ tolkas annars som en formel i arket.
function skyddaCell(t) {
  return /^[=+\-@]/.test(t) ? "'" + t : t;
}
