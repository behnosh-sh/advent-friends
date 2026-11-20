# Vännernas resultattavla i Google

Samma upplägg som familjens: ett privat Google Sheet och ett litet Apps Script som körs som Behnosh.
Arket delas aldrig, och koderna finns bara i arket. Två script:

- `resultat.gs` – webbappen som sidan pratar med. Ligger i vännernas ark.
- `kopiera-behnosh.gs` – kopierar Behnoshs rader från familjens ark till fliken **Familjen** i vännernas ark
  var 10:e minut. Ett eget, fristående projekt. Familjens ark läses bara.

## 1. Arket och webbappen (en gång)

1. Skapa ett nytt Google Sheet, t.ex. "Advent friends results". Dela det inte.
2. I arket: **Tillägg > Apps Script**. Ta bort det som står där och klistra in hela `resultat.gs`. Spara.
3. Välj funktionen **installera** i listan överst och tryck **Kör**. Godkänn behörigheterna
   (**Avancerat > Gå till ... (osäkert)**, det är ditt eget script).
   Nu finns flikarna **Spelare**, **Resultat** och **Familjen**.
4. I fliken **Spelare**: byt ut Friend 1–5 mot vännernas namn (så som de ska synas på tavlan) och skriv en
   fyrsiffrig kod till var och en, även till dig själv. Raden **Behnosh** ska heta exakt så.
5. **Distribuera > Ny distribution**, kugghjulet: **Webbapp**. Kör som: **Jag**. Vem har åtkomst: **Alla**.
   Tryck **Distribuera** och kopiera adressen (slutar på `/exec`).
6. Skicka adressen till Claude, eller klistra in den i `js/resultat.js` på raden `var ADRESS = '';`.

## 2. Kopieringen av dina resultat (en gång)

1. Gå till https://script.google.com och tryck **Nytt projekt**. Döp det till t.ex. "Kopiera Behnosh".
2. Ta bort det som står där och klistra in hela `kopiera-behnosh.gs`.
3. Klistra in adressen till familjens ark mellan fnuttarna på raden `var FAMILJENS_ARK = '';`
   och adressen till vännernas ark på raden `var VANNERNAS_ARK = '';`. Spara.
4. Välj funktionen **installera** och tryck **Kör**. Godkänn behörigheterna. Google frågar efter
   tillgång till dina kalkylark, eftersom scriptet ska läsa ett ark och skriva i ett annat.
5. Klart. Loggen säger hur många rader som kopierades, och fliken **Familjen** i vännernas ark fylls.
   Den uppdateras sedan var 10:e minut. Familjens ark ändras aldrig.

## Säkerhet

- Utan rätt kod gör scriptet ingenting. Efter 10 felaktiga koder på en timme spärras alla försök i en timme (50 den 24–26 december).
- Andras resultat för en dag syns bara för den som själv har skickat in den dagen. Från julafton syns allt för alla.
- Bara det första resultatet per person och dag sparas. Ändringar görs direkt i arket.
- Behnosh kan inte skicka något i vännernas kalender. Hennes rader kommer bara från fliken Familjen.
- Vill du nollställa efter testandet: radera raderna i fliken Resultat (inte rubrikraden).
