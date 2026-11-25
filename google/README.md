# Vännernas resultattavla i Google

Samma upplägg som familjens: ett privat Google Sheet och ett litet Apps Script som körs som Behnosh.
Arket delas aldrig, och koderna finns bara i arket.

`resultat.gs` är webbappen som sidan pratar med. Den har `@OnlyCurrentDoc` och kommer bara åt vännernas ark.
Inget script eller formel kommer åt familjens ark. Dina resultat klistrar du in själv i fliken **Familjen**.

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

## Dina resultat från familjen (när du vill, t.ex. en gång om dagen)

1. I familjens ark, fliken **Resultat**: markera dina rader (filtrera gärna på kolumnen Spelare = Behnosh) och kopiera dem.
2. I vännernas ark, fliken **Familjen**: klistra in från rad 2 (rubriken står kvar). Det är enklast att varje gång
   ersätta allt under rubriken med alla dina rader, så kan inget bli dubbelt.
3. Klart. Texten får vara på svenska och alla dagar får följa med: scriptet gör om texten till engelska,
   hoppar över dag 7, 16 och 21 och visar "–" för dig de dagarna. Andra personers rader i fliken ignoreras.

## Säkerhet

- Utan rätt kod gör scriptet ingenting. Efter 10 felaktiga koder på en timme spärras alla försök i en timme (50 den 24–26 december).
- Andras resultat för en dag syns bara för den som själv har skickat in den dagen. Från julafton syns allt för alla.
- Bara det första resultatet per person och dag sparas. Ändringar görs direkt i arket.
- Behnosh kan inte skicka något i vännernas kalender. Hennes rader kommer bara från fliken Familjen.
- Vill du nollställa efter testandet: radera raderna i fliken Resultat (inte rubrikraden).
