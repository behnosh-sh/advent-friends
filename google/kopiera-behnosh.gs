// Kopierar Behnoshs resultat från familjens ark till fliken "Familjen" i vännernas ark.
// Ett eget, fristående Apps Script-projekt (script.google.com > Nytt projekt), inte det i vännernas ark,
// så att vännernas webbapp fortsätter att bara komma åt sitt eget ark.
//
// Familjens ark LÄSES bara (getValues). Inget i familjens ark eller familjens script ändras.
// Bara Behnoshs egna rader kopieras; de andras resultat i familjen lämnar aldrig familjens ark.
// Vännernas script (resultat.gs) gör om texten till engelska och hoppar över dagarna med eget innehåll.
//
// Så sätter du upp det (en gång): fyll i de två adresserna nedan, välj installera och tryck Kör.
// installera() kopierar direkt och lägger en klocka som kopierar var 10:e minut.

var FAMILJENS_ARK = '';   // adressen till familjens resultatark (https://docs.google.com/spreadsheets/d/...)
var VANNERNAS_ARK = '';   // adressen till vännernas resultatark
var NAMN = 'Behnosh';     // namnet i familjens flik Spelare

function installera() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'kopiera') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('kopiera').timeBased().everyMinutes(10).create();
  kopiera();
}

function kopiera() {
  if (!FAMILJENS_ARK || !VANNERNAS_ARK) throw new Error('Fyll i FAMILJENS_ARK och VANNERNAS_ARK överst i scriptet.');
  var fran = SpreadsheetApp.openByUrl(FAMILJENS_ARK).getSheetByName('Resultat');
  if (!fran) throw new Error('Familjens ark har ingen flik Resultat.');
  var rader = fran.getDataRange().getValues();
  var rubrik = rader[0].slice(0, 8);
  var hennes = rader.slice(1).filter(function (r) { return String(r[3]).trim() === NAMN; })
    .map(function (r) {
      // Text som börjar med = + - @ skulle annars bli en formel i vännernas ark.
      return r.slice(0, 8).map(function (v) { return typeof v === 'string' && /^[=+\-@]/.test(v) ? "'" + v : v; });
    });

  var till = SpreadsheetApp.openByUrl(VANNERNAS_ARK);
  var flik = till.getSheetByName('Familjen') || till.insertSheet('Familjen');
  var data = [rubrik].concat(hennes);
  flik.clearContents();
  flik.getRange(1, 1, data.length, 8).setValues(data);
  Logger.log('Kopierade ' + hennes.length + ' rader för ' + NAMN + '.');
}
